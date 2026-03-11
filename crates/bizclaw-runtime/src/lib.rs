//! # BizClaw Runtime
//!
//! Runtime adapters for executing commands and processes.
//! - **NativeRuntime** — direct host execution with timeout
//! - **SandboxedRuntime** — restricted execution with command whitelist

pub mod native;

use async_trait::async_trait;
use bizclaw_core::error::Result;
use bizclaw_core::traits::runtime::RuntimeAdapter;

/// Native runtime adapter — runs commands directly on the host.
pub struct NativeRuntime {
    /// Max execution time in seconds (default: 900 = 15 min).
    pub timeout_secs: u64,
}

impl Default for NativeRuntime {
    fn default() -> Self {
        let timeout = std::env::var("BIZCLAW_SHELL_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(900);
        Self {
            timeout_secs: timeout,
        }
    }
}

impl NativeRuntime {
    /// Create a new NativeRuntime with custom timeout.
    pub fn with_timeout(secs: u64) -> Self {
        Self { timeout_secs: secs }
    }
}

#[async_trait]
impl RuntimeAdapter for NativeRuntime {
    fn name(&self) -> &str {
        "native"
    }

    async fn execute_command(&self, command: &str, workdir: Option<&str>) -> Result<String> {
        let mut cmd = tokio::process::Command::new("sh");
        cmd.arg("-c").arg(command);
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        if let Some(dir) = workdir {
            cmd.current_dir(dir);
        }

        let output = tokio::time::timeout(
            std::time::Duration::from_secs(self.timeout_secs),
            cmd.output(),
        )
        .await
        .map_err(|_| {
            bizclaw_core::error::BizClawError::Other(format!(
                "Command timed out after {}s ({}min): {}",
                self.timeout_secs,
                self.timeout_secs / 60,
                &command[..command.len().min(100)]
            ))
        })??;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        if output.status.success() {
            Ok(stdout.to_string())
        } else {
            let code = output.status.code().unwrap_or(-1);
            Ok(format!(
                "[exit {}] {}\n{}",
                code,
                stdout.trim(),
                if stderr.is_empty() {
                    ""
                } else {
                    stderr.trim_end()
                }
            ))
        }
    }
}

/// Sandboxed runtime — restricted command execution.
/// Only allows whitelisted commands, no shell injection.
pub struct SandboxedRuntime {
    /// Allowed commands (e.g., ["ls", "cat", "grep", "echo"]).
    pub allowed_commands: Vec<String>,
    /// Max execution time in seconds.
    pub timeout_secs: u64,
}

impl Default for SandboxedRuntime {
    fn default() -> Self {
        let timeout = std::env::var("BIZCLAW_SHELL_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(900);
        Self {
            allowed_commands: vec![
                "ls".into(),
                "cat".into(),
                "echo".into(),
                "grep".into(),
                "head".into(),
                "tail".into(),
                "wc".into(),
                "date".into(),
                "whoami".into(),
                "pwd".into(),
                "find".into(),
                "sort".into(),
                "uniq".into(),
                "tr".into(),
                "cut".into(),
                "sed".into(),
                "awk".into(),
                "curl".into(),
                "python3".into(),
                "node".into(),
            ],
            timeout_secs: timeout,
        }
    }
}

#[async_trait]
impl RuntimeAdapter for SandboxedRuntime {
    fn name(&self) -> &str {
        "sandboxed"
    }

    async fn execute_command(&self, command: &str, workdir: Option<&str>) -> Result<String> {
        // Extract the base command (first word)
        let base_cmd = command.split_whitespace().next().unwrap_or("");

        if !self.allowed_commands.iter().any(|c| c == base_cmd) {
            return Err(bizclaw_core::error::BizClawError::Other(format!(
                "Command '{}' not allowed in sandbox. Allowed: {}",
                base_cmd,
                self.allowed_commands.join(", ")
            )));
        }

        // Reject shell metacharacters that could bypass the whitelist
        let dangerous = [';', '|', '&', '`', '$', '(', ')', '{', '}'];
        if command.chars().any(|c| dangerous.contains(&c)) {
            return Err(bizclaw_core::error::BizClawError::Other(
                "Shell metacharacters not allowed in sandbox mode".into(),
            ));
        }

        // Delegate to native execution with timeout
        let native = NativeRuntime::with_timeout(self.timeout_secs);
        native.execute_command(command, workdir).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_native_runtime_echo() {
        let rt = NativeRuntime::default();
        let result = rt
            .execute_command("echo 'hello from runtime'", None)
            .await
            .unwrap();
        assert!(result.contains("hello from runtime"));
    }

    #[tokio::test]
    async fn test_native_runtime_timeout() {
        let rt = NativeRuntime::with_timeout(1);
        let result = rt.execute_command("sleep 5", None).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_native_runtime_stderr() {
        let rt = NativeRuntime::default();
        let result = rt
            .execute_command("ls /nonexistent_path_abc123", None)
            .await
            .unwrap();
        assert!(result.contains("exit"));
    }

    #[tokio::test]
    async fn test_sandboxed_allowed() {
        let rt = SandboxedRuntime::default();
        let result = rt.execute_command("echo sandbox test", None).await.unwrap();
        assert!(result.contains("sandbox test"));
    }

    #[tokio::test]
    async fn test_sandboxed_blocked() {
        let rt = SandboxedRuntime::default();
        let result = rt.execute_command("rm -rf /", None).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_sandboxed_metachar() {
        let rt = SandboxedRuntime::default();
        let result = rt.execute_command("echo hello; rm -rf /", None).await;
        assert!(result.is_err());
    }
}
