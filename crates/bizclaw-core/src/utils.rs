//! Core utility functions for BizClaw.

/// Safely truncate a string to at most `max_chars` **characters** (not bytes).
/// Returns a `&str` slice that is guaranteed to be at a valid UTF-8 boundary.
///
/// # Examples
/// ```
/// use bizclaw_core::utils::safe_truncate;
/// assert_eq!(safe_truncate("hello world", 5), "hello");
/// assert_eq!(safe_truncate("xin chào", 5), "xin c");
/// assert_eq!(safe_truncate("短い", 10), "短い"); // shorter than max
/// ```
pub fn safe_truncate(s: &str, max_chars: usize) -> &str {
    match s.char_indices().nth(max_chars) {
        Some((byte_idx, _)) => &s[..byte_idx],
        None => s, // string is shorter than max_chars
    }
}

/// Like `safe_truncate`, but returns a `String` with "..." appended if truncated.
pub fn safe_truncate_ellipsis(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        s.to_string()
    } else {
        format!("{}...", safe_truncate(s, max_chars))
    }
}

/// Mask a string for safe logging (show first N chars, replace rest with "••••").
/// Safe for multibyte characters.
pub fn mask_string(s: &str, visible_chars: usize) -> String {
    if s.is_empty() {
        return String::new();
    }
    let char_count = s.chars().count();
    if char_count <= visible_chars {
        return "••••".to_string();
    }
    let prefix = safe_truncate(s, visible_chars);
    format!("{}••••", prefix)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safe_truncate_ascii() {
        assert_eq!(safe_truncate("hello world", 5), "hello");
        assert_eq!(safe_truncate("hello", 10), "hello");
        assert_eq!(safe_truncate("", 5), "");
    }

    #[test]
    fn test_safe_truncate_vietnamese() {
        let vn = "Xin chào thế giới";
        // "Xin c" = 5 chars
        assert_eq!(safe_truncate(vn, 5), "Xin c");
        // Full string
        assert_eq!(safe_truncate(vn, 100), vn);
    }

    #[test]
    fn test_safe_truncate_cjk() {
        let cjk = "你好世界こんにちは";
        assert_eq!(safe_truncate(cjk, 4), "你好世界");
    }

    #[test]
    fn test_safe_truncate_emoji() {
        let emoji = "🚀🔥💯✅";
        assert_eq!(safe_truncate(emoji, 2), "🚀🔥");
    }

    #[test]
    fn test_safe_truncate_ellipsis() {
        assert_eq!(safe_truncate_ellipsis("hello world", 5), "hello...");
        assert_eq!(safe_truncate_ellipsis("hi", 5), "hi");
    }

    #[test]
    fn test_mask_string() {
        assert_eq!(mask_string("sk-abc123xyz", 4), "sk-a••••");
        assert_eq!(mask_string("ab", 4), "••••");
        assert_eq!(mask_string("", 4), "");
    }
}
