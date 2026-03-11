//! Hand Runner — executes Hands on their schedules.
//!
//! The runner is a background loop that checks all registered Hands,
//! triggers those that are due, and manages their lifecycle.

use chrono::Utc;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::hand::{Hand, HandPhase, HandRunResult, HandStatus};
use crate::registry::HandRegistry;

/// The Hand Runner — background loop that drives all Hands.
pub struct HandRunner {
    registry: Arc<Mutex<HandRegistry>>,
    tick_interval_secs: u64,
}

impl HandRunner {
    /// Create a new runner with a registry and tick interval.
    pub fn new(registry: Arc<Mutex<HandRegistry>>, tick_interval_secs: u64) -> Self {
        Self {
            registry,
            tick_interval_secs,
        }
    }

    /// Start the background runner loop.
    /// This spawns a tokio task that checks and executes Hands.
    pub fn spawn(self) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            tracing::info!(
                "🤚 Hand Runner started — checking every {}s",
                self.tick_interval_secs
            );
            loop {
                self.tick().await;
                tokio::time::sleep(std::time::Duration::from_secs(self.tick_interval_secs)).await;
            }
        })
    }

    /// Single tick — check all Hands and execute those that are due.
    async fn tick(&self) {
        let now = Utc::now();
        let mut registry = self.registry.lock().await;

        // Collect names of hands that should run
        let due_hands: Vec<String> = registry
            .list()
            .iter()
            .filter(|h| h.should_run(now))
            .map(|h| h.manifest.name.clone())
            .collect();

        for hand_name in due_hands {
            if let Some(hand) = registry.get_mut(&hand_name) {
                tracing::info!(
                    "🤚 Executing hand: {} {}",
                    hand.manifest.icon,
                    hand.manifest.label
                );
                hand.status = HandStatus::Running;

                // Execute each phase
                let result = execute_hand(hand).await;
                hand.record_run(result);

                tracing::info!("🤚 Hand {} completed: {}", hand.manifest.label, hand.status);
            }
        }
    }
}

/// Execute a single Hand's multi-phase playbook.
///
/// Each phase:
/// 1. Builds a system prompt from the phase manifest
/// 2. Executes with the configured model/provider
/// 3. Captures output and timing
/// 4. Passes context to the next phase
///
/// When bizclaw-agent is connected, this will call actual LLM providers.
/// Currently runs phases with structured logging and timing.
async fn execute_hand(hand: &Hand) -> HandRunResult {
    let started = Utc::now();
    let run_id = uuid::Uuid::new_v4().to_string()[..8].to_string();

    let mut phases = Vec::new();
    let mut total_tokens = 0u64;
    let mut previous_output: Option<String> = None;

    for phase_manifest in &hand.manifest.phases {
        let phase_start = Utc::now();

        // Build context from previous phase output
        let context = previous_output
            .as_deref()
            .unwrap_or("(first phase — no prior context)");

        // Execute phase via configured provider
        let (output, tokens, error) = execute_phase(
            &hand.manifest.model,
            &phase_manifest.name,
            &phase_manifest.description,
            context,
            &phase_manifest.allowed_tools,
        )
        .await;

        let phase_tokens = tokens;
        total_tokens += phase_tokens;

        let phase_status = if error.is_some() {
            HandStatus::Failed
        } else {
            HandStatus::Completed
        };

        previous_output = output.clone();

        phases.push(HandPhase {
            name: phase_manifest.name.clone(),
            status: phase_status,
            started_at: Some(phase_start),
            completed_at: Some(Utc::now()),
            output,
            error,
            tokens_used: phase_tokens,
        });

        // Brief pause between phases
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }

    let completed = Utc::now();
    let cost = estimate_hand_cost(total_tokens, &hand.manifest.model);

    HandRunResult {
        hand_name: hand.manifest.name.clone(),
        run_id,
        started_at: started,
        completed_at: completed,
        status: if phases.iter().any(|p| p.status == HandStatus::Failed) {
            HandStatus::Failed
        } else {
            HandStatus::Completed
        },
        phases,
        total_tokens,
        total_cost_usd: cost,
        summary: format!(
            "{} completed all {} phases in {:.1}s",
            hand.manifest.label,
            hand.manifest.phases.len(),
            (completed - started).num_milliseconds() as f64 / 1000.0
        ),
    }
}

/// Execute a single phase using the configured model.
///
/// Returns (output, tokens_used, error).
/// When bizclaw-agent is connected, this will call actual LLM APIs.
async fn execute_phase(
    model: &str,
    phase_name: &str,
    phase_description: &str,
    context: &str,
    _allowed_tools: &[String],
) -> (Option<String>, u64, Option<String>) {
    tracing::info!("  📋 Phase '{}': {}", phase_name, phase_description);

    // Build prompt for the phase
    let prompt = format!(
        "[Phase: {}]\nTask: {}\nContext: {}\n\nExecute this phase and provide results.",
        phase_name, phase_description, context
    );

    // Estimate tokens from prompt length
    let est_tokens = (prompt.len() as u64 / 4).max(100);

    // Phase execution result
    // When LLM provider is connected, replace this with actual API call:
    // let response = provider.chat(model, &prompt).await;
    let output = format!(
        "Phase '{}' executed with model '{}' ({} est. tokens)",
        phase_name, model, est_tokens
    );

    (Some(output), est_tokens, None)
}

/// Estimate cost for hand execution based on model.
fn estimate_hand_cost(tokens: u64, model: &str) -> f64 {
    let per_1k = if model.contains("flash") || model.contains("mini") {
        0.0001
    } else if model.contains("gpt-4") || model.contains("claude") {
        0.01
    } else if model.contains("deepseek") {
        0.001
    } else {
        0.0005 // Default
    };
    tokens as f64 / 1000.0 * per_1k
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cost_estimation() {
        assert!(estimate_hand_cost(1000, "gemini-flash") < 0.001);
        assert!(estimate_hand_cost(1000, "gpt-4o") > 0.005);
        assert!(estimate_hand_cost(1000, "deepseek-chat") < 0.005);
    }
}
