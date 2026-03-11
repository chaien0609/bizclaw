//! # BizClaw Hands — Autonomous Agent Capabilities
//!
//! BizClaw's autonomous agent capability framework.
//!
//! A "Hand" is an autonomous agent capability that runs independently on a schedule,
//! executes multi-phase playbooks, builds knowledge, and reports results — all without
//! human prompting.
//!
//! ## Architecture
//! ```text
//! bizclaw-hands/
//! ├── HAND.toml          # Hand manifest (name, schedule, phases)
//! ├── system_prompt.md   # Multi-phase playbook (not one-liner!)
//! ├── SKILL.md           # Domain expertise reference
//! └── guardrails.toml    # Approval gates for sensitive actions
//! ```
//!
//! ## Built-in Hands
//! | Hand              | Schedule    | Function                          |
//! |-------------------|-------------|-----------------------------------|
//! | 🔍 Research       | Every 6h    | Competitive research, knowledge graph |
//! | 📊 Analytics      | Daily 6:00  | Data collection, trend analysis   |
//! | 📝 Content        | Daily 8:00  | Content creation & scheduling     |
//! | 🔔 Monitor        | Every 5min  | System monitoring & alerts        |
//! | 🔄 Sync           | Every 30min | Cross-system data synchronization |
//! | 📧 Outreach       | Daily 9:00  | Email outreach automation         |
//! | 🛡️ Security       | Every 1h    | Security scanning & reporting     |

pub mod guardrails;
pub mod hand;
pub mod manifest;
pub mod registry;
pub mod runner;
pub mod skills;

pub use guardrails::{Guardrail, GuardrailAction};
pub use hand::{Hand, HandPhase, HandStatus};
pub use manifest::HandManifest;
pub use registry::HandRegistry;
pub use runner::HandRunner;
