//! Progress Updates — mid-task status messaging for long-running operations.
//!
//! When the agent is executing a multi-step task, it can send intermediate
//! progress updates to the user instead of going silent for minutes.
//!
//! # How it works:
//! 1. Channel adapters implement `ProgressSender` trait
//! 2. Agent loop sends progress before each tool execution
//! 3. User sees: "🔄 Searching web..." → "📝 Writing file..." → final response
//!
//! # Examples:
//! ```text
//! progress.send("🔍 Searching the web for latest Rust news...").await;
//! // ... tool executes ...
//! progress.send("📝 Analyzing 5 results...").await;
//! // ... LLM processes ...
//! // Final response sent normally
//! ```

use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::debug;

/// Trait for sending progress updates to the user.
#[async_trait]
pub trait ProgressSender: Send + Sync {
    /// Send a progress update message.
    async fn send_progress(&self, message: &str);

    /// Send a typing indicator (if supported by channel).
    async fn send_typing(&self);
}

/// No-op progress sender (default when no channel is active).
pub struct NoOpProgress;

#[async_trait]
impl ProgressSender for NoOpProgress {
    async fn send_progress(&self, _message: &str) {}
    async fn send_typing(&self) {}
}

/// Buffered progress sender — collects updates for testing/logging.
pub struct BufferedProgress {
    messages: Arc<Mutex<Vec<String>>>,
}

impl BufferedProgress {
    pub fn new() -> Self {
        Self {
            messages: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Get all collected progress messages.
    pub async fn messages(&self) -> Vec<String> {
        self.messages.lock().await.clone()
    }
}

impl Default for BufferedProgress {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ProgressSender for BufferedProgress {
    async fn send_progress(&self, message: &str) {
        debug!("📊 Progress: {message}");
        self.messages.lock().await.push(message.to_string());
    }

    async fn send_typing(&self) {
        debug!("⌨️ Typing indicator sent");
    }
}

/// Generate a tool-specific progress message.
pub fn tool_progress_message(tool_name: &str, args_preview: &str) -> String {
    let icon = match tool_name {
        "web_search" => "🔍",
        "http_request" => "🌐",
        "browser" => "🖥️",
        "shell" => "⚙️",
        "file" => "📁",
        "edit_file" => "✏️",
        "glob" | "grep" => "🔎",
        "execute_code" => "💻",
        "memory_search" => "🧠",
        "calendar" => "📅",
        "document_reader" => "📄",
        "plan" => "📋",
        "custom_tool" => "🛠️",
        "brv_query" | "brv_curate" => "🧠",
        _ => "🔄",
    };

    let preview: String = if args_preview.len() > 60 {
        let truncated: String = args_preview.chars().take(60).collect();
        format!("{}...", truncated)
    } else {
        args_preview.to_string()
    };

    format!("{icon} Executing `{tool_name}`: {preview}")
}

/// Shared progress sender wrapper (for use across async contexts).
pub type SharedProgress = Arc<dyn ProgressSender>;

/// Create a no-op progress sender.
pub fn no_op_progress() -> SharedProgress {
    Arc::new(NoOpProgress)
}

/// Create a buffered progress sender (for testing).
pub fn buffered_progress() -> Arc<BufferedProgress> {
    Arc::new(BufferedProgress::new())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_buffered_progress() {
        let progress = BufferedProgress::new();
        progress.send_progress("Step 1: Searching...").await;
        progress.send_progress("Step 2: Analyzing...").await;
        progress.send_progress("Step 3: Writing report...").await;

        let msgs = progress.messages().await;
        assert_eq!(msgs.len(), 3);
        assert_eq!(msgs[0], "Step 1: Searching...");
        assert_eq!(msgs[2], "Step 3: Writing report...");
    }

    #[tokio::test]
    async fn test_noop_progress() {
        let progress = NoOpProgress;
        progress.send_progress("This goes nowhere").await;
        progress.send_typing().await;
        // No panic, no error — just does nothing
    }

    #[test]
    fn test_tool_progress_message() {
        let msg = tool_progress_message("web_search", "latest Rust news");
        assert!(msg.contains("🔍"));
        assert!(msg.contains("web_search"));
        assert!(msg.contains("latest Rust news"));

        let msg = tool_progress_message("shell", "ls -la /home/user");
        assert!(msg.contains("⚙️"));

        // Truncation test
        let long_args = "x".repeat(100);
        let msg = tool_progress_message("file", &long_args);
        assert!(msg.contains("..."));
        assert!(msg.len() < 200);
    }

    #[test]
    fn test_unknown_tool_default_icon() {
        let msg = tool_progress_message("some_new_tool", "args");
        assert!(msg.contains("🔄"));
    }
}
