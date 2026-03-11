//! Shell command execution tool — with mandatory security enforcement.
//!
//! Defense-in-depth: even if the agent pipeline check fails,
//! this tool enforces the allowlist independently.

use async_trait::async_trait;
use bizclaw_core::error::Result;
use bizclaw_core::traits::Tool;
use bizclaw_core::types::{ToolDefinition, ToolResult};

/// Forbidden paths that should never appear in shell commands.
const FORBIDDEN_PATH_PATTERNS: &[&str] = &[
    "/etc/shadow",
    "/etc/passwd",
    ".ssh/",
    "authorized_keys",
    "/proc/",
    "/sys/",
    "/dev/",
    "secrets.enc",
];

/// Dangerous command patterns that bypass simple allowlists.
const DANGEROUS_PATTERNS: &[&str] = &[
    "rm -rf",
    "mkfs",
    "dd if=",
    ":(){ :|:",
    "chmod 777",
    "chown root",
    "curl|",
    "wget|",
    "nc -l",
    "ncat",
    "python -c",
    "python3 -c",
    "perl -e",
    "ruby -e",
    "base64 -d",
    "eval ",
    "exec ",
    "> /dev/",
    "history",
    ".bash_history",
    "id_rsa",
];

pub struct ShellTool;

impl ShellTool {
    pub fn new() -> Self {
        Self
    }

    /// Validate command against built-in security rules.
    /// Returns an error message if the command is blocked.
    fn validate_command(command: &str) -> Option<String> {
        let lower = command.to_lowercase();

        // 1. Block shell metacharacters (command chaining)
        const DANGEROUS_CHARS: &[char] = &[';', '|', '&', '`', '$', '(', ')', '{', '}', '>', '<'];
        if command.chars().any(|c| DANGEROUS_CHARS.contains(&c)) {
            return Some(format!(
                "🔒 Blocked: command contains shell metacharacters (;|&`$(){{}}><). Use simple commands without chaining. Attempted: '{}'",
                &command[..command.len().min(60)]
            ));
        }

        // 2. Block dangerous patterns
        for pattern in DANGEROUS_PATTERNS {
            if lower.contains(pattern) {
                return Some(format!(
                    "🔒 Blocked: command matches dangerous pattern '{}'. Command: '{}'",
                    pattern,
                    &command[..command.len().min(60)]
                ));
            }
        }

        // 3. Block access to forbidden paths
        for path in FORBIDDEN_PATH_PATTERNS {
            if lower.contains(path) {
                return Some(format!(
                    "🔒 Blocked: command accesses forbidden path '{}'. Command: '{}'",
                    path,
                    &command[..command.len().min(60)]
                ));
            }
        }

        None // Command is safe
    }
}

impl Default for ShellTool {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Tool for ShellTool {
    fn name(&self) -> &str {
        "shell"
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "shell".into(),
            description: "Execute a shell command and return stdout/stderr. Commands are validated against security rules — shell metacharacters (;|&`$) and dangerous patterns are blocked. Default timeout: 15 minutes (configurable via BIZCLAW_SHELL_TIMEOUT_SECS env var).".into(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute (no chaining with ; | & etc.)"
                    },
                    "workdir": {
                        "type": "string",
                        "description": "Working directory (optional)"
                    },
                    "timeout_secs": {
                        "type": "integer",
                        "description": "Timeout in seconds (optional, default: 900 = 15 min, max: 3600)"
                    }
                },
                "required": ["command"]
            }),
        }
    }

    async fn execute(&self, arguments: &str) -> Result<ToolResult> {
        let args: serde_json::Value = serde_json::from_str(arguments)
            .map_err(|e| bizclaw_core::error::BizClawError::Tool(e.to_string()))?;

        let command = args["command"]
            .as_str()
            .ok_or_else(|| bizclaw_core::error::BizClawError::Tool("Missing 'command'".into()))?;

        let workdir = args["workdir"].as_str();

        // Timeout: per-call > env var > default (900s = 15 min)
        let default_timeout: u64 = std::env::var("BIZCLAW_SHELL_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(900);
        let timeout_secs = args["timeout_secs"]
            .as_u64()
            .map(|t| t.min(3600)) // Cap at 1 hour max
            .unwrap_or(default_timeout);

        // ═══ MANDATORY SECURITY CHECK (defense-in-depth) ═══
        if let Some(block_reason) = Self::validate_command(command) {
            tracing::warn!("🛡️ ShellTool security block: {}", block_reason);
            return Ok(ToolResult {
                tool_call_id: String::new(),
                output: block_reason,
                success: false,
            });
        }

        // Execute with configurable timeout
        let mut cmd = tokio::process::Command::new("sh");
        cmd.arg("-c").arg(command);

        // Clear environment — only pass essential vars
        cmd.env_clear();
        for var in &["PATH", "HOME", "USER", "LANG", "TERM"] {
            if let Ok(val) = std::env::var(var) {
                cmd.env(var, val);
            }
        }

        if let Some(dir) = workdir {
            cmd.current_dir(dir);
        }

        tracing::info!(
            "🖥️ ShellTool: executing (timeout={}s): {}",
            timeout_secs,
            &command[..command.len().min(100)]
        );

        let output = tokio::time::timeout(
            std::time::Duration::from_secs(timeout_secs),
            cmd.output(),
        )
        .await
        .map_err(|_| {
            tracing::warn!("⏰ ShellTool: command timed out after {}s: {}", timeout_secs, &command[..command.len().min(100)]);
            bizclaw_core::error::BizClawError::Timeout(
                format!("Command timed out after {}s ({}min). Command: {}. Increase timeout with timeout_secs parameter or BIZCLAW_SHELL_TIMEOUT_SECS env var.",
                    timeout_secs, timeout_secs / 60, &command[..command.len().min(80)])
            )
        })?
        .map_err(|e| bizclaw_core::error::BizClawError::Tool(e.to_string()))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        // Truncate large outputs (1MB max)
        let stdout = if stdout.len() > 1_048_576 {
            format!("{}...\n[truncated at 1MB]", &stdout[..1_048_576])
        } else {
            stdout
        };

        let result = if output.status.success() {
            stdout
        } else {
            format!(
                "STDOUT:\n{stdout}\nSTDERR:\n{stderr}\nExit code: {}",
                output.status.code().unwrap_or(-1)
            )
        };

        Ok(ToolResult {
            tool_call_id: String::new(),
            output: result,
            success: output.status.success(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blocks_semicolon_injection() {
        assert!(ShellTool::validate_command("ls; rm -rf /").is_some());
    }

    #[test]
    fn test_blocks_pipe_injection() {
        assert!(ShellTool::validate_command("cat file | bash").is_some());
    }

    #[test]
    fn test_blocks_backtick_injection() {
        assert!(ShellTool::validate_command("echo `whoami`").is_some());
    }

    #[test]
    fn test_blocks_dollar_injection() {
        assert!(ShellTool::validate_command("echo $PATH").is_some());
    }

    #[test]
    fn test_blocks_dangerous_patterns() {
        assert!(ShellTool::validate_command("rm -rf /tmp").is_some());
        assert!(ShellTool::validate_command("dd if=/dev/zero of=/dev/sda").is_some());
    }

    #[test]
    fn test_blocks_forbidden_paths() {
        assert!(ShellTool::validate_command("cat /etc/shadow").is_some());
        assert!(ShellTool::validate_command("cat /etc/passwd").is_some());
        assert!(ShellTool::validate_command("cat ~/.ssh/id_rsa").is_some());
    }

    #[test]
    fn test_allows_safe_commands() {
        assert!(ShellTool::validate_command("ls -la /tmp").is_none());
        assert!(ShellTool::validate_command("pwd").is_none());
        assert!(ShellTool::validate_command("cat README.md").is_none());
        assert!(ShellTool::validate_command("whoami").is_none());
        assert!(ShellTool::validate_command("date").is_none());
        assert!(ShellTool::validate_command("cargo build").is_none());
    }
}
