//! Agent Team / Org Chart — Paperclip-inspired agent hierarchy.
//!
//! Organizes agents into teams with lead/member roles, escalation rules,
//! and task delegation capabilities.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Role within an agent team.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentRole {
    /// Team lead — receives escalations, delegates tasks
    Lead,
    /// Regular team member
    Member,
    /// Specialist — handles specific task types only
    Specialist,
    /// Observer — monitors but doesn't act
    Observer,
}

/// Escalation rule — when to escalate from member to lead.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationRule {
    /// Rule identifier
    pub id: String,
    /// Condition type
    pub condition: EscalationCondition,
    /// Action to take when condition is met
    pub action: EscalationAction,
    /// Whether this rule is active
    #[serde(default = "bool_true")]
    pub enabled: bool,
}

fn bool_true() -> bool {
    true
}

/// Conditions that trigger escalation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EscalationCondition {
    /// Negative sentiment detected (below threshold)
    SentimentBelow { threshold: f32 },
    /// Keywords detected in message
    KeywordMatch { keywords: Vec<String> },
    /// Agent failed to respond within timeout
    ResponseTimeout { timeout_seconds: u64 },
    /// Agent explicitly requests escalation
    AgentRequest,
    /// Error rate exceeds threshold
    ErrorRateAbove { threshold: f32, window_seconds: u64 },
    /// Token budget running low
    BudgetLow { threshold_percent: f32 },
}

/// Actions to take on escalation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EscalationAction {
    /// Escalate to team lead
    EscalateToLead,
    /// Escalate to a specific agent
    EscalateToAgent { agent_id: String },
    /// Notify owner via channel
    NotifyOwner { channel: String, message_template: String },
    /// Pause the agent
    PauseAgent,
    /// Switch to a different LLM model
    SwitchModel { model: String },
}

/// Agent entry in the team.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamAgent {
    /// Agent identifier
    pub id: String,
    /// Display name
    pub name: String,
    /// Role in the team
    pub role: AgentRole,
    /// Channels this agent handles
    pub channels: Vec<String>,
    /// Task types this agent specializes in
    #[serde(default)]
    pub specialties: Vec<String>,
    /// LLM model assigned to this agent
    #[serde(default)]
    pub model: String,
    /// Whether this agent is currently active
    #[serde(default = "bool_true")]
    pub active: bool,
}

/// Agent team configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTeam {
    /// Team name (e.g., "Sales Team", "Support Team")
    pub name: String,
    /// Team description
    #[serde(default)]
    pub description: String,
    /// Team members
    pub agents: Vec<TeamAgent>,
    /// Escalation rules
    #[serde(default)]
    pub escalation_rules: Vec<EscalationRule>,
}

impl AgentTeam {
    /// Create a new team with a lead agent.
    pub fn new(name: impl Into<String>, lead: TeamAgent) -> Self {
        Self {
            name: name.into(),
            description: String::new(),
            agents: vec![lead],
            escalation_rules: Vec::new(),
        }
    }

    /// Add a member to the team.
    pub fn add_member(&mut self, agent: TeamAgent) {
        self.agents.push(agent);
    }

    /// Add an escalation rule.
    pub fn add_rule(&mut self, rule: EscalationRule) {
        self.escalation_rules.push(rule);
    }

    /// Get the team lead.
    pub fn lead(&self) -> Option<&TeamAgent> {
        self.agents.iter().find(|a| a.role == AgentRole::Lead)
    }

    /// Get active members (excluding lead).
    pub fn active_members(&self) -> Vec<&TeamAgent> {
        self.agents
            .iter()
            .filter(|a| a.active && a.role != AgentRole::Lead)
            .collect()
    }

    /// Find the best agent for a given channel.
    pub fn agent_for_channel(&self, channel: &str) -> Option<&TeamAgent> {
        self.agents
            .iter()
            .find(|a| a.active && a.channels.contains(&channel.to_string()))
    }

    /// Find agents with a specific specialty.
    pub fn agents_with_specialty(&self, specialty: &str) -> Vec<&TeamAgent> {
        self.agents
            .iter()
            .filter(|a| a.active && a.specialties.contains(&specialty.to_string()))
            .collect()
    }
}

/// Agent Organization — manages multiple teams.
pub struct AgentOrganization {
    teams: Arc<RwLock<HashMap<String, AgentTeam>>>,
}

impl AgentOrganization {
    pub fn new() -> Self {
        Self {
            teams: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a team.
    pub async fn register_team(&self, team: AgentTeam) {
        let name = team.name.clone();
        self.teams.write().await.insert(name.clone(), team);
        tracing::info!("Orchestrator: registered team '{}'", name);
    }

    /// Get a team by name.
    pub async fn get_team(&self, name: &str) -> Option<AgentTeam> {
        self.teams.read().await.get(name).cloned()
    }

    /// List all team names.
    pub async fn list_teams(&self) -> Vec<String> {
        self.teams.read().await.keys().cloned().collect()
    }

    /// Find which team handles a given channel.
    pub async fn team_for_channel(&self, channel: &str) -> Option<(String, TeamAgent)> {
        let teams = self.teams.read().await;
        for (team_name, team) in teams.iter() {
            if let Some(agent) = team.agent_for_channel(channel) {
                return Some((team_name.clone(), agent.clone()));
            }
        }
        None
    }

    /// Get organization summary (for dashboard).
    pub async fn summary(&self) -> serde_json::Value {
        let teams = self.teams.read().await;
        let team_summaries: Vec<serde_json::Value> = teams
            .values()
            .map(|t| {
                serde_json::json!({
                    "name": t.name,
                    "description": t.description,
                    "agent_count": t.agents.len(),
                    "active_count": t.agents.iter().filter(|a| a.active).count(),
                    "lead": t.lead().map(|l| &l.name),
                    "channels": t.agents.iter()
                        .flat_map(|a| a.channels.iter())
                        .collect::<std::collections::HashSet<_>>(),
                    "rule_count": t.escalation_rules.len(),
                })
            })
            .collect();

        serde_json::json!({
            "total_teams": teams.len(),
            "total_agents": teams.values().map(|t| t.agents.len()).sum::<usize>(),
            "teams": team_summaries,
        })
    }
}

impl Default for AgentOrganization {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_lead() -> TeamAgent {
        TeamAgent {
            id: "lead-1".into(),
            name: "Sales Lead".into(),
            role: AgentRole::Lead,
            channels: vec!["zalo".into(), "telegram".into()],
            specialties: vec!["sales".into()],
            model: "gpt-4o-mini".into(),
            active: true,
        }
    }

    fn make_member() -> TeamAgent {
        TeamAgent {
            id: "member-1".into(),
            name: "Support Agent".into(),
            role: AgentRole::Member,
            channels: vec!["zalo".into()],
            specialties: vec!["support".into()],
            model: "gpt-4o-mini".into(),
            active: true,
        }
    }

    #[test]
    fn test_team_creation() {
        let mut team = AgentTeam::new("Sales Team", make_lead());
        team.add_member(make_member());

        assert_eq!(team.agents.len(), 2);
        assert!(team.lead().is_some());
        assert_eq!(team.active_members().len(), 1);
    }

    #[test]
    fn test_agent_for_channel() {
        let mut team = AgentTeam::new("Sales Team", make_lead());
        team.add_member(make_member());

        assert!(team.agent_for_channel("zalo").is_some());
        assert!(team.agent_for_channel("discord").is_none());
    }

    #[tokio::test]
    async fn test_organization() {
        let org = AgentOrganization::new();

        let mut team = AgentTeam::new("Sales Team", make_lead());
        team.add_member(make_member());
        org.register_team(team).await;

        assert_eq!(org.list_teams().await.len(), 1);

        let (team_name, agent) = org.team_for_channel("zalo").await.unwrap();
        assert_eq!(team_name, "Sales Team");
        assert_eq!(agent.role, AgentRole::Lead);
    }
}
