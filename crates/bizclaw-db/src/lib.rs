//! # BizClaw Database Abstraction Layer
//!
//! Provides a unified `DataStore` trait with implementations for:
//! - **SQLite** (default, standalone mode) — zero-config, file-based
//! - **PostgreSQL** (optional, managed mode) — multi-tenant, pgvector
//!
//! All orchestration data (delegations, teams, tasks, handoffs, traces)
//! flows through this abstraction layer.

#[cfg(feature = "postgres")]
pub mod postgres;
pub mod sqlite;
pub mod store;

#[cfg(feature = "postgres")]
pub use postgres::PostgresStore;
pub use sqlite::SqliteStore;
pub use store::DataStore;
