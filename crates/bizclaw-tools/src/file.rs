//! File read/write tool — with mandatory path security validation.
//!
//! Enforces path restrictions to prevent reading/writing sensitive files.

use async_trait::async_trait;
use bizclaw_core::error::Result;
use bizclaw_core::traits::Tool;
use bizclaw_core::types::{ToolDefinition, ToolResult};

/// Paths that are always forbidden (case-insensitive prefix match).
const FORBIDDEN_PATHS: &[&str] = &["/etc/shadow", "/etc/gshadow", "/proc/", "/sys/", "/dev/"];

/// Path prefixes that require extra caution (warning but allowed).
const SENSITIVE_PATHS: &[&str] = &[
    "/etc/",
    "/root/.ssh",
    "/root/.gnupg",
    "/root/.aws",
    "/root/.config",
];

/// Files that should never be written to.
const WRITE_FORBIDDEN: &[&str] = &[
    "/etc/passwd",
    "/etc/shadow",
    "/etc/sudoers",
    "authorized_keys",
    "id_rsa",
    "id_ed25519",
    ".env",
    "secrets.enc",
    ".git/config",
];

pub struct FileTool;

impl FileTool {
    pub fn new() -> Self {
        Self
    }

    /// Validate a path for read or write access.
    /// Returns an error reason if the path is blocked.
    fn validate_path(path: &str, is_write: bool) -> Option<String> {
        let lower = path.to_lowercase();

        // 1. Absolute forbidden paths
        for forbidden in FORBIDDEN_PATHS {
            if lower.starts_with(forbidden) {
                return Some(format!(
                    "🔒 Access denied: '{}' is in a restricted directory ({})",
                    path, forbidden
                ));
            }
        }

        // 2. Path traversal detection
        if path.contains("../") || path.contains("/..") {
            return Some(format!(
                "🔒 Access denied: path traversal detected in '{}'",
                path
            ));
        }

        // 3. Write-specific restrictions
        if is_write {
            for pattern in WRITE_FORBIDDEN {
                if lower.contains(pattern) {
                    return Some(format!(
                        "🔒 Write denied: '{}' matches protected pattern '{}'",
                        path, pattern
                    ));
                }
            }
        }

        // 4. Warn about sensitive paths (read allowed, just logged)
        for sensitive in SENSITIVE_PATHS {
            if lower.starts_with(sensitive) {
                tracing::warn!(
                    "⚠️ FileTool accessing sensitive path: {} (action: {})",
                    path,
                    if is_write { "write" } else { "read" }
                );
            }
        }

        None // Path is allowed
    }
}

impl Default for FileTool {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Tool for FileTool {
    fn name(&self) -> &str {
        "file"
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "file".into(),
            description: "Read, write, or list files and directories. Path security is enforced — sensitive system files are protected.".into(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["read", "write", "append", "list"],
                        "description": "Action: read (file contents), write (create/overwrite), append (add to end), list (directory listing with metadata)"
                    },
                    "path": { "type": "string", "description": "File or directory path" },
                    "content": { "type": "string", "description": "Content for write/append actions" },
                    "start_line": { "type": "integer", "description": "Start line for partial read (1-indexed, optional)" },
                    "end_line": { "type": "integer", "description": "End line for partial read (1-indexed, optional)" }
                },
                "required": ["action", "path"]
            }),
        }
    }

    async fn execute(&self, arguments: &str) -> Result<ToolResult> {
        let args: serde_json::Value = serde_json::from_str(arguments)
            .map_err(|e| bizclaw_core::error::BizClawError::Tool(e.to_string()))?;

        let action = args["action"].as_str().unwrap_or("read");
        let path = args["path"]
            .as_str()
            .ok_or_else(|| bizclaw_core::error::BizClawError::Tool("Missing 'path'".into()))?;

        // ═══ MANDATORY PATH SECURITY CHECK ═══
        let is_write = matches!(action, "write" | "append");
        if let Some(block_reason) = Self::validate_path(path, is_write) {
            tracing::warn!("🛡️ FileTool security block: {}", block_reason);
            return Ok(ToolResult {
                tool_call_id: String::new(),
                output: block_reason,
                success: false,
            });
        }

        let result = match action {
            "read" => {
                let content = tokio::fs::read_to_string(path).await.map_err(|e| {
                    bizclaw_core::error::BizClawError::Tool(format!("Read failed: {e}"))
                })?;

                // Support partial reads with line ranges
                let start = args["start_line"].as_u64().map(|l| l as usize);
                let end = args["end_line"].as_u64().map(|l| l as usize);

                if let (Some(s), Some(e)) = (start, end) {
                    let lines: Vec<&str> = content.lines().collect();
                    let s = s.saturating_sub(1).min(lines.len());
                    let e = e.min(lines.len());
                    let total = lines.len();
                    let selected: Vec<String> = lines[s..e]
                        .iter()
                        .enumerate()
                        .map(|(i, l)| format!("{:>4}: {}", s + i + 1, l))
                        .collect();
                    format!(
                        "File: {} ({} total lines, showing {}-{}):\n{}",
                        path,
                        total,
                        s + 1,
                        e,
                        selected.join("\n")
                    )
                } else {
                    // If file is very large, show line count
                    let line_count = content.lines().count();
                    if content.len() > 10000 {
                        format!(
                            "File: {} ({} lines, {} bytes):\n{}...\n[truncated at 10000 bytes]",
                            path,
                            line_count,
                            content.len(),
                            &content[..10000]
                        )
                    } else {
                        content
                    }
                }
            }
            "write" => {
                let content = args["content"].as_str().unwrap_or("");
                // Create parent directories if needed
                if let Some(parent) = std::path::Path::new(path).parent() {
                    tokio::fs::create_dir_all(parent).await.map_err(|e| {
                        bizclaw_core::error::BizClawError::Tool(format!("Create dir: {e}"))
                    })?;
                }
                tokio::fs::write(path, content)
                    .await
                    .map_err(|e| bizclaw_core::error::BizClawError::Tool(e.to_string()))?;
                format!("Written {} bytes to {path}", content.len())
            }
            "append" => {
                let content = args["content"].as_str().unwrap_or("");
                use tokio::io::AsyncWriteExt;
                let mut file = tokio::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(path)
                    .await
                    .map_err(|e| {
                        bizclaw_core::error::BizClawError::Tool(format!("Open failed: {e}"))
                    })?;
                file.write_all(content.as_bytes()).await.map_err(|e| {
                    bizclaw_core::error::BizClawError::Tool(format!("Write failed: {e}"))
                })?;
                format!("Appended {} bytes to {path}", content.len())
            }
            "list" => {
                let mut entries_result = tokio::fs::read_dir(path)
                    .await
                    .map_err(|e| bizclaw_core::error::BizClawError::Tool(e.to_string()))?;

                let mut items = Vec::new();
                while let Some(entry) = entries_result
                    .next_entry()
                    .await
                    .map_err(|e| bizclaw_core::error::BizClawError::Tool(e.to_string()))?
                {
                    let name = entry.file_name().to_string_lossy().to_string();
                    let meta = entry.metadata().await.ok();
                    let is_dir = meta.as_ref().map(|m| m.is_dir()).unwrap_or(false);
                    let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                    let modified = meta
                        .as_ref()
                        .and_then(|m| m.modified().ok())
                        .map(|t| {
                            let dt: chrono::DateTime<chrono::Utc> = t.into();
                            dt.format("%Y-%m-%d %H:%M").to_string()
                        })
                        .unwrap_or_else(|| "?".into());

                    let kind = if is_dir { "dir " } else { "file" };
                    let size_str = if is_dir {
                        "-".to_string()
                    } else {
                        format_size(size)
                    };

                    items.push(format!("{kind}  {size_str:>8}  {modified}  {name}"));
                }

                items.sort();
                if items.is_empty() {
                    format!("Directory {} is empty", path)
                } else {
                    format!(
                        "Directory: {} ({} entries)\n{}",
                        path,
                        items.len(),
                        items.join("\n")
                    )
                }
            }
            _ => {
                return Err(bizclaw_core::error::BizClawError::Tool(format!(
                    "Unknown action: {action}"
                )));
            }
        };

        Ok(ToolResult {
            tool_call_id: String::new(),
            output: result,
            success: true,
        })
    }
}

fn format_size(bytes: u64) -> String {
    if bytes < 1024 {
        format!("{bytes} B")
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else if bytes < 1024 * 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.1} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blocks_shadow_read() {
        assert!(FileTool::validate_path("/etc/shadow", false).is_some());
    }

    #[test]
    fn test_blocks_proc_access() {
        assert!(FileTool::validate_path("/proc/self/environ", false).is_some());
    }

    #[test]
    fn test_blocks_dev_access() {
        assert!(FileTool::validate_path("/dev/sda", false).is_some());
    }

    #[test]
    fn test_blocks_path_traversal() {
        assert!(FileTool::validate_path("/tmp/../etc/shadow", false).is_some());
        assert!(FileTool::validate_path("../../../etc/passwd", false).is_some());
    }

    #[test]
    fn test_blocks_write_to_ssh_keys() {
        assert!(FileTool::validate_path("/root/.ssh/authorized_keys", true).is_some());
        assert!(FileTool::validate_path("/home/user/.ssh/id_rsa", true).is_some());
    }

    #[test]
    fn test_blocks_write_to_env_files() {
        assert!(FileTool::validate_path("/app/.env", true).is_some());
        assert!(FileTool::validate_path("secrets.enc", true).is_some());
    }

    #[test]
    fn test_allows_normal_read() {
        assert!(FileTool::validate_path("/tmp/test.txt", false).is_none());
        assert!(FileTool::validate_path("/home/user/code/main.rs", false).is_none());
        assert!(FileTool::validate_path("README.md", false).is_none());
    }

    #[test]
    fn test_allows_normal_write() {
        assert!(FileTool::validate_path("/tmp/output.txt", true).is_none());
        assert!(FileTool::validate_path("/home/user/code/output.rs", true).is_none());
    }
}
