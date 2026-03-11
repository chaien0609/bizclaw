//! Tiered Model Routing — classify tasks by complexity and route to
//! appropriate models. Simple tasks (file reads, status checks) use a
//! fast/cheap model; complex tasks (architecture, debugging) use the
//! most capable model. Classification is entirely rule-based (no LLM call).
//!
//! Inspired by SkyClaw's model router, adapted for BizClaw's multi-provider
//! and Vietnamese-aware context.

use serde::{Deserialize, Serialize};
use tracing::{debug, info};

// ── Read-only / simple tool names ────────────────────────────────────────

/// Tools considered read-only / low-complexity.
const READ_ONLY_TOOLS: &[&str] = &[
    "file",          // read mode
    "glob",          // find files
    "grep",          // search files
    "memory_search", // search memory
    "web_search",    // web search
    "session_context",
    "document_reader",
];

/// Keywords in task descriptions that indicate a complex task.
const COMPLEX_KEYWORDS: &[&str] = &[
    // English
    "architecture",
    "architect",
    "debug",
    "debugging",
    "refactor",
    "refactoring",
    "design",
    "redesign",
    "migrate",
    "migration",
    "optimize",
    "optimization",
    "security audit",
    "performance",
    "investigate",
    "root cause",
    "rewrite",
    "analyze",
    "deploy",
    "deployment",
    // Vietnamese
    "kiến trúc",
    "thiết kế",
    "tối ưu",
    "phân tích",
    "sửa lỗi",
    "triển khai",
    "bảo mật",
    "tái cấu trúc",
    "điều tra",
    "nguyên nhân",
    "viết lại",
];

/// Maximum task description length (in chars) for a task to be considered Simple.
const SIMPLE_DESCRIPTION_MAX_LEN: usize = 120;

/// History length threshold above which a conversation is considered complex.
const COMPLEX_HISTORY_THRESHOLD: usize = 12;

// ── Enums ────────────────────────────────────────────────────────────────

/// Task complexity level as determined by rule-based classification.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TaskComplexity {
    /// Simple: single read-only tool, short description, shallow history.
    Simple,
    /// Standard: the default bucket for everything that is neither
    /// clearly simple nor clearly complex.
    Standard,
    /// Complex: architecture/debug/refactor tasks, deep history, compound
    /// tool usage, or multi-step planning.
    Complex,
}

impl std::fmt::Display for TaskComplexity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskComplexity::Simple => write!(f, "Simple"),
            TaskComplexity::Standard => write!(f, "Standard"),
            TaskComplexity::Complex => write!(f, "Complex"),
        }
    }
}

/// Model tier that maps to a configured model name.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ModelTier {
    /// Fastest / cheapest model for trivial tasks.
    Fast,
    /// Default model — the primary workhorse.
    Primary,
    /// Most capable model for hard tasks.
    Premium,
}

impl std::fmt::Display for ModelTier {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelTier::Fast => write!(f, "Fast"),
            ModelTier::Primary => write!(f, "Primary"),
            ModelTier::Premium => write!(f, "Premium"),
        }
    }
}

// ── User override prefixes ───────────────────────────────────────────────

/// Prefix that forces the Fast tier.
const FORCE_FAST_PREFIX: &str = "!fast";

/// Prefix that forces the Premium tier.
const FORCE_BEST_PREFIX: &str = "!best";

// ── Configuration ────────────────────────────────────────────────────────

/// Configuration for the tiered model router.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRouterConfig {
    /// Whether tiered routing is enabled.
    #[serde(default)]
    pub enabled: bool,

    /// Model name for the Fast tier (e.g. "gemini-2.0-flash").
    #[serde(default)]
    pub fast_model: Option<String>,

    /// Model name for the Primary tier. This is the default model.
    #[serde(default = "default_primary_model")]
    pub primary_model: String,

    /// Model name for the Premium tier (e.g. "claude-sonnet-4-20250514").
    #[serde(default)]
    pub premium_model: Option<String>,
}

fn default_primary_model() -> String {
    "gemini-2.5-flash".to_string()
}

impl Default for ModelRouterConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            fast_model: None,
            primary_model: default_primary_model(),
            premium_model: None,
        }
    }
}

// ── Router ───────────────────────────────────────────────────────────────

/// Rule-based model router. Classifies task complexity and selects the
/// appropriate model tier without making any LLM calls.
#[derive(Debug, Clone)]
pub struct ModelRouter {
    config: ModelRouterConfig,
}

impl ModelRouter {
    /// Create a new `ModelRouter` from configuration.
    pub fn new(config: ModelRouterConfig) -> Self {
        Self { config }
    }

    /// Whether the router is enabled.
    pub fn enabled(&self) -> bool {
        self.config.enabled
    }

    /// Convenience method: classify, select tier, and return the model name
    /// in one call.
    ///
    /// * `history_len` — number of messages in conversation so far.
    /// * `tool_names` — names of tools used (or requested) in this turn.
    /// * `task_description` — the user's message text.
    pub fn route(
        &self,
        history_len: usize,
        tool_names: &[&str],
        task_description: &str,
    ) -> RoutingDecision {
        if !self.config.enabled {
            return RoutingDecision {
                complexity: TaskComplexity::Standard,
                tier: ModelTier::Primary,
                model: self.config.primary_model.clone(),
                reason: "Router disabled — using primary".to_string(),
            };
        }

        // Check for user overrides
        if let Some(forced_tier) = Self::detect_user_override(task_description) {
            let model = self.get_model_name(forced_tier);
            info!(
                tier = %forced_tier,
                model = %model,
                "🎯 User override detected"
            );
            return RoutingDecision {
                complexity: TaskComplexity::Standard,
                tier: forced_tier,
                model: model.to_string(),
                reason: format!("User override: {}", forced_tier),
            };
        }

        let complexity = self.classify_complexity(history_len, tool_names, task_description);
        let tier = Self::select_tier(complexity);
        let model = self.get_model_name(tier);

        info!(
            complexity = %complexity,
            tier = %tier,
            model = %model,
            "🎯 Routed task to model"
        );

        RoutingDecision {
            complexity,
            tier,
            model: model.to_string(),
            reason: format!("{} task → {} tier", complexity, tier),
        }
    }

    /// Classify the complexity of a task based on conversation history,
    /// tool usage, and task description. Entirely rule-based.
    pub fn classify_complexity(
        &self,
        history_len: usize,
        tool_names: &[&str],
        task_description: &str,
    ) -> TaskComplexity {
        let desc_lower = task_description.to_lowercase();

        // ── Complex signals ──────────────────────────────────────────

        // 1. Keywords indicating complex work.
        let has_complex_keyword = COMPLEX_KEYWORDS.iter().any(|kw| desc_lower.contains(kw));

        // 2. Deep conversation history.
        let deep_history = history_len > COMPLEX_HISTORY_THRESHOLD;

        // 3. Multiple distinct tool types used.
        let unique_tools: std::collections::HashSet<&str> = tool_names.iter().copied().collect();
        let multi_tool_types = unique_tools.len() > 2;

        // 4. Multi-step planning indicators.
        let has_planning = desc_lower.contains("plan")
            || desc_lower.contains("step by step")
            || desc_lower.contains("từng bước")
            || desc_lower.contains("lên kế hoạch");

        if has_complex_keyword || (deep_history && multi_tool_types) || has_planning {
            debug!(
                has_complex_keyword,
                deep_history, multi_tool_types, has_planning, "Classified as Complex"
            );
            return TaskComplexity::Complex;
        }

        // ── Simple signals ───────────────────────────────────────────

        // Short description.
        let short_description = task_description.len() < SIMPLE_DESCRIPTION_MAX_LEN;

        // Single tool call (or zero).
        let single_tool = tool_names.len() <= 1;

        // All requested tools are read-only.
        let all_read_only = tool_names.iter().all(|t| READ_ONLY_TOOLS.contains(t));

        if short_description && single_tool && all_read_only && !deep_history {
            debug!(
                short_description,
                single_tool, all_read_only, "Classified as Simple"
            );
            return TaskComplexity::Simple;
        }

        // ── Default ──────────────────────────────────────────────────
        TaskComplexity::Standard
    }

    /// Map a complexity level to a model tier.
    pub fn select_tier(complexity: TaskComplexity) -> ModelTier {
        match complexity {
            TaskComplexity::Simple => ModelTier::Fast,
            TaskComplexity::Standard => ModelTier::Primary,
            TaskComplexity::Complex => ModelTier::Premium,
        }
    }

    /// Resolve a model tier to a concrete model name string, falling
    /// back to the primary model if a tier's model is not configured.
    pub fn get_model_name(&self, tier: ModelTier) -> &str {
        match tier {
            ModelTier::Fast => self
                .config
                .fast_model
                .as_deref()
                .unwrap_or(&self.config.primary_model),
            ModelTier::Primary => &self.config.primary_model,
            ModelTier::Premium => self
                .config
                .premium_model
                .as_deref()
                .unwrap_or(&self.config.primary_model),
        }
    }

    /// Detect user override prefixes (`!fast`, `!best`) in the task description.
    fn detect_user_override(task_description: &str) -> Option<ModelTier> {
        let trimmed = task_description.trim_start();
        if trimmed.starts_with(FORCE_FAST_PREFIX) {
            Some(ModelTier::Fast)
        } else if trimmed.starts_with(FORCE_BEST_PREFIX) {
            Some(ModelTier::Premium)
        } else {
            None
        }
    }

    /// Get the current configuration.
    pub fn config(&self) -> &ModelRouterConfig {
        &self.config
    }

    /// Update configuration at runtime (e.g., via natural language).
    pub fn update_config(&mut self, config: ModelRouterConfig) {
        info!(
            enabled = config.enabled,
            fast = ?config.fast_model,
            primary = %config.primary_model,
            premium = ?config.premium_model,
            "🔧 Model router config updated"
        );
        self.config = config;
    }
}

/// Result of a routing decision.
#[derive(Debug, Clone, Serialize)]
pub struct RoutingDecision {
    /// Classified complexity of the task.
    pub complexity: TaskComplexity,
    /// Selected model tier.
    pub tier: ModelTier,
    /// Concrete model name to use.
    pub model: String,
    /// Human-readable reason for the decision.
    pub reason: String,
}

impl std::fmt::Display for RoutingDecision {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} → {}", self.reason, self.model)
    }
}

// ── Tests ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> ModelRouterConfig {
        ModelRouterConfig {
            enabled: true,
            fast_model: Some("gemini-2.0-flash".to_string()),
            primary_model: "gemini-2.5-flash".to_string(),
            premium_model: Some("claude-sonnet-4-20250514".to_string()),
        }
    }

    #[test]
    fn test_simple_task() {
        let router = ModelRouter::new(test_config());
        let decision = router.route(3, &["file"], "read the config file");
        assert_eq!(decision.complexity, TaskComplexity::Simple);
        assert_eq!(decision.tier, ModelTier::Fast);
        assert_eq!(decision.model, "gemini-2.0-flash");
    }

    #[test]
    fn test_complex_task_keyword() {
        let router = ModelRouter::new(test_config());
        let decision = router.route(
            5,
            &["shell", "file"],
            "debug the authentication module and investigate the root cause",
        );
        assert_eq!(decision.complexity, TaskComplexity::Complex);
        assert_eq!(decision.tier, ModelTier::Premium);
        assert_eq!(decision.model, "claude-sonnet-4-20250514");
    }

    #[test]
    fn test_complex_task_vietnamese() {
        let router = ModelRouter::new(test_config());
        let decision = router.route(
            3,
            &["shell"],
            "phân tích kiến trúc hệ thống và tối ưu hiệu năng",
        );
        assert_eq!(decision.complexity, TaskComplexity::Complex);
    }

    #[test]
    fn test_standard_task() {
        let router = ModelRouter::new(test_config());
        let decision = router.route(
            5,
            &["shell", "file"],
            "create a new API endpoint for user profiles",
        );
        assert_eq!(decision.complexity, TaskComplexity::Standard);
        assert_eq!(decision.tier, ModelTier::Primary);
        assert_eq!(decision.model, "gemini-2.5-flash");
    }

    #[test]
    fn test_user_override_fast() {
        let router = ModelRouter::new(test_config());
        let decision = router.route(5, &["shell"], "!fast list all files");
        assert_eq!(decision.tier, ModelTier::Fast);
    }

    #[test]
    fn test_user_override_best() {
        let router = ModelRouter::new(test_config());
        let decision = router.route(5, &["shell"], "!best write a comprehensive test suite");
        assert_eq!(decision.tier, ModelTier::Premium);
    }

    #[test]
    fn test_disabled_router() {
        let config = ModelRouterConfig {
            enabled: false,
            ..test_config()
        };
        let router = ModelRouter::new(config);
        let decision = router.route(
            20,
            &["shell", "file", "browser"],
            "complex architecture redesign",
        );
        assert_eq!(decision.tier, ModelTier::Primary);
        assert_eq!(decision.model, "gemini-2.5-flash");
    }

    #[test]
    fn test_deep_history_multi_tool() {
        let router = ModelRouter::new(test_config());
        let decision = router.route(
            15,
            &["shell", "file", "browser"],
            "update the user dashboard component",
        );
        assert_eq!(decision.complexity, TaskComplexity::Complex);
    }

    #[test]
    fn test_fallback_to_primary() {
        let config = ModelRouterConfig {
            enabled: true,
            fast_model: None,
            primary_model: "default-model".to_string(),
            premium_model: None,
        };
        let router = ModelRouter::new(config);

        // Simple task but no fast model → falls back to primary
        let decision = router.route(1, &["file"], "hi");
        assert_eq!(decision.model, "default-model");

        // Complex task but no premium model → falls back to primary
        let decision = router.route(20, &["shell", "file", "browser"], "debug the architecture");
        assert_eq!(decision.model, "default-model");
    }

    #[test]
    fn test_routing_decision_display() {
        let decision = RoutingDecision {
            complexity: TaskComplexity::Complex,
            tier: ModelTier::Premium,
            model: "claude-sonnet-4-20250514".to_string(),
            reason: "Complex task → Premium tier".to_string(),
        };
        assert!(format!("{}", decision).contains("claude-sonnet"));
    }

    #[test]
    fn test_select_tier_mapping() {
        assert_eq!(
            ModelRouter::select_tier(TaskComplexity::Simple),
            ModelTier::Fast
        );
        assert_eq!(
            ModelRouter::select_tier(TaskComplexity::Standard),
            ModelTier::Primary
        );
        assert_eq!(
            ModelRouter::select_tier(TaskComplexity::Complex),
            ModelTier::Premium
        );
    }
}
