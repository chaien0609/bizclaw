//! BizClaw Desktop — Standalone AI Agent Platform
//!
//! Bundles the full BizClaw gateway server into a single executable.
//! Opens the dashboard in the default browser automatically.
//! Data stored in ~/.bizclaw/ (cross-platform).
//!
//! Usage:
//!   bizclaw-desktop              # Start on random port, open browser
//!   bizclaw-desktop --port 3000  # Start on specific port
//!   bizclaw-desktop --no-open    # Don't auto-open browser

use bizclaw_core::config::{BizClawConfig, GatewayConfig};

/// Find a free TCP port
fn find_free_port() -> u16 {
    let listener = std::net::TcpListener::bind("127.0.0.1:0").expect("Cannot bind to port");
    listener.local_addr().unwrap().port()
}

/// Get or create config for desktop mode
fn desktop_config(port: u16) -> BizClawConfig {
    let config_path = BizClawConfig::default_path();

    let mut config = if config_path.exists() {
        BizClawConfig::load_from(&config_path).unwrap_or_default()
    } else {
        // First-time setup — create default config
        let default = BizClawConfig::default();
        if let Some(parent) = config_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = default.save();
        tracing::info!("📁 Created default config at: {}", config_path.display());
        default
    };

    // Override gateway config for desktop
    config.gateway = GatewayConfig {
        host: "127.0.0.1".into(),
        port,
        require_pairing: false, // deprecated — JWT auth only
    };

    config
}

fn main() {
    // Parse CLI args
    let mut port: Option<u16> = None;
    let mut no_open = false;
    let args: Vec<String> = std::env::args().collect();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--port" | "-p" => {
                if i + 1 < args.len() {
                    port = args[i + 1].parse().ok();
                    i += 1;
                }
            }
            "--no-open" => no_open = true,
            "--help" | "-h" => {
                println!("⚡ BizClaw Desktop — AI Agent Platform");
                println!();
                println!("Usage: bizclaw-desktop [OPTIONS]");
                println!();
                println!("Options:");
                println!("  -p, --port <PORT>  Port to listen on (default: random)");
                println!("  --no-open          Don't auto-open browser");
                println!("  -h, --help         Show this help");
                println!();
                println!("Data directory: {}", BizClawConfig::home_dir().display());
                return;
            }
            _ => {}
        }
        i += 1;
    }

    let port = port.unwrap_or_else(find_free_port);

    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .compact()
        .init();

    let app_name = format!("BizClaw Desktop v{}", env!("CARGO_PKG_VERSION"));
    println!();
    println!("  ⚡ {app_name}");
    println!("  ─────────────────────────────────────");
    println!("  🌐 Dashboard:  http://127.0.0.1:{port}");
    println!("  📁 Data:       {}", BizClawConfig::home_dir().display());
    println!("  🛑 Press Ctrl+C to stop");
    println!();

    let config = desktop_config(port);

    // Build async runtime
    let rt = tokio::runtime::Runtime::new().expect("Failed to create async runtime");

    rt.block_on(async {
        // Auto-open browser after a short delay
        if !no_open {
            let url = format!("http://127.0.0.1:{port}");
            tokio::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                if let Err(e) = open::that(&url) {
                    tracing::warn!("Could not open browser: {e}");
                    println!("  📎 Open manually: {url}");
                }
            });
        }

        // Start the gateway server (this blocks until shutdown)
        if let Err(e) = bizclaw_gateway::server::start(&config.gateway).await {
            tracing::error!("Server error: {e}");
            std::process::exit(1);
        }
    });
}
