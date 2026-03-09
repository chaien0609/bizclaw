//! BizClaw Orchestrator — Paperclip-inspired agent orchestration layer.
//!
//! Features:
//! - **Agent Team/Org Chart**: Hierarchical agent structure with lead/member roles
//! - **Token Budget**: Per-agent token/cost budgets with alerts and actions
//! - **Heartbeat Monitor**: Agent health tracking with auto-restart
//! - **Ticket System**: Conversation-to-ticket mapping with audit trail

pub mod budget;
pub mod heartbeat;
pub mod team;
pub mod ticket;
