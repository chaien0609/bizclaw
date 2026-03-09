//! Stealth Browser Configuration — anti-detection patches for headless Chrome
//!
//! Provides stealth mode constants and JavaScript patches that can be injected
//! into any browser automation tool (PinchTab, Chromiumoxide, etc.) to avoid
//! bot detection.
//!
//! ## Stealth Features (inspired by SkyClaw v1.2)
//! - Anti-detection Chrome launch flags (disable automation indicators)
//! - JavaScript patches for navigator.webdriver, plugins, languages, chrome.runtime, WebGL
//! - Realistic user-agent and window size
//! - Session cookie persistence

/// Realistic user-agent string to avoid headless detection.
/// Uses a common Windows Chrome fingerprint.
pub const STEALTH_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
    AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

/// macOS Safari user-agent (alternative).
pub const STEALTH_USER_AGENT_MAC: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
    AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15";

/// Realistic window dimensions.
pub const STEALTH_WINDOW_WIDTH: u32 = 1920;
pub const STEALTH_WINDOW_HEIGHT: u32 = 1080;

/// Chrome launch flags for anti-detection.
pub const STEALTH_CHROME_FLAGS: &[&str] = &[
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    // Anti-detection flags
    "--disable-blink-features=AutomationControlled",
    "--disable-infobars",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-ipc-flooding-protection",
    "--lang=en-US,en",
    // Disable automation extensions
    "--disable-extensions",
    "--disable-default-apps",
    "--disable-component-extensions-with-background-pages",
    // Additional stealth
    "--disable-features=IsolateOrigins,site-per-process",
    "--flag-switches-begin",
    "--flag-switches-end",
];

/// JavaScript patches injected before any page scripts execute.
/// Masks automation indicators to avoid bot detection.
pub const STEALTH_JS: &str = r#"
// ─── BizClaw Stealth Patches ───────────────────────────────────────

// 1. Hide navigator.webdriver (primary bot detection signal)
Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true
});

// 2. Fake navigator.plugins (empty array is a bot signal)
Object.defineProperty(navigator, 'plugins', {
    get: () => {
        const arr = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '', length: 1 },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: '', length: 1 }
        ];
        arr.length = 3;
        return arr;
    },
    configurable: true
});

// 3. Fake navigator.languages
Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en', 'vi'],
    configurable: true
});

// 4. Hide chrome.runtime (automation indicator)
if (window.chrome) {
    const originalChrome = window.chrome;
    window.chrome = {
        ...originalChrome,
        runtime: undefined
    };
}

// 5. WebGL vendor/renderer spoofing (avoid headless fingerprint)
(function() {
    const getParameterOrig = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
        // UNMASKED_VENDOR_WEBGL
        if (param === 37445) return 'Intel Inc.';
        // UNMASKED_RENDERER_WEBGL
        if (param === 37446) return 'Intel Iris OpenGL Engine';
        return getParameterOrig.apply(this, arguments);
    };
    if (typeof WebGL2RenderingContext !== 'undefined') {
        const getParameter2Orig = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(param) {
            if (param === 37445) return 'Intel Inc.';
            if (param === 37446) return 'Intel Iris OpenGL Engine';
            return getParameter2Orig.apply(this, arguments);
        };
    }
})();

// 6. Patch permissions query (headless returns "denied" for notifications)
(function() {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = function(parameters) {
        if (parameters.name === 'notifications') {
            return Promise.resolve({ state: Notification.permission });
        }
        return originalQuery.apply(this, arguments);
    };
})();

// 7. Patch iframe contentWindow detection
Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
    get: function() {
        return window;
    }
});

// 8. Fix missing navigator.connection (only exists in real Chrome)
if (!navigator.connection) {
    Object.defineProperty(navigator, 'connection', {
        get: () => ({
            effectiveType: '4g',
            rtt: 50,
            downlink: 10,
            saveData: false
        }),
        configurable: true
    });
}
"#;

/// Build the user-agent flag string for Chrome.
pub fn user_agent_flag() -> String {
    format!("--user-agent={}", STEALTH_USER_AGENT)
}

/// Build complete stealth arguments list for Chrome launch.
pub fn stealth_args() -> Vec<String> {
    let mut args: Vec<String> = STEALTH_CHROME_FLAGS
        .iter()
        .map(|s| s.to_string())
        .collect();
    args.push(user_agent_flag());
    args.push(format!(
        "--window-size={},{}",
        STEALTH_WINDOW_WIDTH, STEALTH_WINDOW_HEIGHT
    ));
    args
}

/// Configuration for stealth browser sessions.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StealthConfig {
    /// Whether stealth mode is enabled.
    pub enabled: bool,
    /// Custom user-agent override.
    pub user_agent: Option<String>,
    /// Window width.
    pub width: u32,
    /// Window height.
    pub height: u32,
    /// Idle timeout in seconds before auto-closing.
    pub idle_timeout_secs: u64,
    /// Whether to inject anti-detection JavaScript.
    pub inject_stealth_js: bool,
}

impl Default for StealthConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            user_agent: None,
            width: STEALTH_WINDOW_WIDTH,
            height: STEALTH_WINDOW_HEIGHT,
            idle_timeout_secs: 300,
            inject_stealth_js: true,
        }
    }
}

impl StealthConfig {
    /// Get the effective user-agent string.
    pub fn effective_user_agent(&self) -> &str {
        self.user_agent.as_deref().unwrap_or(STEALTH_USER_AGENT)
    }

    /// Build Chrome arguments from this config.
    pub fn chrome_args(&self) -> Vec<String> {
        let mut args: Vec<String> = STEALTH_CHROME_FLAGS
            .iter()
            .map(|s| s.to_string())
            .collect();
        args.push(format!("--user-agent={}", self.effective_user_agent()));
        args.push(format!("--window-size={},{}", self.width, self.height));
        args
    }
}

/// Serializable cookie for session persistence.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SessionCookie {
    pub name: String,
    pub value: String,
    pub domain: Option<String>,
    pub path: Option<String>,
    pub expires: Option<f64>,
    pub http_only: Option<bool>,
    pub secure: Option<bool>,
    pub same_site: Option<String>,
}

/// Save session cookies to a JSON file.
pub fn save_cookies(cookies: &[SessionCookie], session_name: &str) -> std::io::Result<String> {
    let sessions_dir = sessions_dir()?;
    std::fs::create_dir_all(&sessions_dir)?;

    let safe_name = sanitize_session_name(session_name);
    let path = sessions_dir.join(format!("{}.json", safe_name));

    let json = serde_json::to_string_pretty(cookies)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

    std::fs::write(&path, &json)?;

    // Set file permissions to owner-only (Unix)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o600);
        std::fs::set_permissions(&path, perms)?;
    }

    tracing::info!(
        session = %safe_name,
        cookies = cookies.len(),
        path = %path.display(),
        "🔒 Browser session saved"
    );

    Ok(format!(
        "Session '{}' saved: {} cookies → {}",
        safe_name,
        cookies.len(),
        path.display()
    ))
}

/// Load session cookies from a JSON file.
pub fn load_cookies(session_name: &str) -> std::io::Result<Vec<SessionCookie>> {
    let sessions_dir = sessions_dir()?;
    let safe_name = sanitize_session_name(session_name);
    let path = sessions_dir.join(format!("{}.json", safe_name));

    if !path.exists() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("Session '{}' not found at {}", safe_name, path.display()),
        ));
    }

    let json = std::fs::read_to_string(&path)?;
    let cookies: Vec<SessionCookie> = serde_json::from_str(&json)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

    tracing::info!(
        session = %safe_name,
        cookies = cookies.len(),
        "🔓 Browser session loaded"
    );

    Ok(cookies)
}

/// List available saved sessions.
pub fn list_sessions() -> std::io::Result<Vec<String>> {
    let sessions_dir = sessions_dir()?;
    if !sessions_dir.exists() {
        return Ok(vec![]);
    }

    let mut sessions = Vec::new();
    for entry in std::fs::read_dir(&sessions_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                sessions.push(stem.to_string());
            }
        }
    }
    sessions.sort();
    Ok(sessions)
}

/// Delete a saved session.
pub fn delete_session(session_name: &str) -> std::io::Result<()> {
    let sessions_dir = sessions_dir()?;
    let safe_name = sanitize_session_name(session_name);
    let path = sessions_dir.join(format!("{}.json", safe_name));

    if path.exists() {
        std::fs::remove_file(&path)?;
        tracing::info!(session = %safe_name, "🗑️ Browser session deleted");
    }
    Ok(())
}

/// Return the sessions directory path: `~/.bizclaw/sessions/`.
fn sessions_dir() -> std::io::Result<std::path::PathBuf> {
    dirs::home_dir()
        .map(|h| h.join(".bizclaw").join("sessions"))
        .ok_or_else(|| {
            std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Cannot determine home directory",
            )
        })
}

/// Sanitize a session name to a safe filename.
fn sanitize_session_name(name: &str) -> String {
    let sanitized: String = name
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect();
    if sanitized.is_empty() {
        "default".to_string()
    } else {
        sanitized
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stealth_args_non_empty() {
        let args = stealth_args();
        assert!(!args.is_empty());
        assert!(args.iter().any(|a| a.contains("--user-agent")));
        assert!(args.iter().any(|a| a.contains("--window-size")));
    }

    #[test]
    fn test_stealth_js_not_empty() {
        assert!(!STEALTH_JS.is_empty());
        assert!(STEALTH_JS.contains("webdriver"));
        assert!(STEALTH_JS.contains("plugins"));
        assert!(STEALTH_JS.contains("WebGL"));
    }

    #[test]
    fn test_default_config() {
        let config = StealthConfig::default();
        assert!(config.enabled);
        assert!(config.inject_stealth_js);
        assert_eq!(config.width, 1920);
        assert_eq!(config.height, 1080);
        assert_eq!(config.idle_timeout_secs, 300);
    }

    #[test]
    fn test_effective_user_agent() {
        let config = StealthConfig::default();
        assert_eq!(config.effective_user_agent(), STEALTH_USER_AGENT);

        let custom = StealthConfig {
            user_agent: Some("Custom/1.0".to_string()),
            ..Default::default()
        };
        assert_eq!(custom.effective_user_agent(), "Custom/1.0");
    }

    #[test]
    fn test_chrome_args() {
        let config = StealthConfig::default();
        let args = config.chrome_args();
        assert!(args.iter().any(|a| a.contains("AutomationControlled")));
    }

    #[test]
    fn test_sanitize_session_name() {
        assert_eq!(sanitize_session_name("hello world"), "hello_world");
        assert_eq!(sanitize_session_name("test.session-1"), "test.session-1");
        assert_eq!(sanitize_session_name(""), "default");
        assert_eq!(sanitize_session_name("a/b\\c:d"), "a_b_c_d");
    }

    #[test]
    fn test_session_cookie_serde() {
        let cookie = SessionCookie {
            name: "session_id".to_string(),
            value: "abc123".to_string(),
            domain: Some(".example.com".to_string()),
            path: Some("/".to_string()),
            expires: Some(1999999999.0),
            http_only: Some(true),
            secure: Some(true),
            same_site: Some("Lax".to_string()),
        };

        let json = serde_json::to_string(&cookie).unwrap();
        let deserialized: SessionCookie = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "session_id");
        assert_eq!(deserialized.value, "abc123");
    }
}
