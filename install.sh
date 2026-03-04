#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BizClaw AI Agent Platform — One-Click Install (Standalone)
# Usage: curl -sSL https://bizclaw.vn/install.sh | sudo bash
# Works on: Ubuntu/Debian VPS, Raspberry Pi, any Linux with systemd
#
# This installs the STANDALONE (single-tenant) version.
# For multi-tenant Cloud, see docker-compose.yml
# ═══════════════════════════════════════════════════════════════

set -e

REPO="https://github.com/nguyenduchoai/bizclaw.git"
INSTALL_DIR="/opt/bizclaw"
BIN_DIR="/usr/local/bin"
DATA_DIR="$HOME/.bizclaw"
SERVICE_NAME="bizclaw"

echo ""
echo "  🦀 BizClaw AI Agent — Standalone Installer"
echo "  ════════════════════════════════════════════"
echo ""

# Check root or sudo
if [ "$(id -u)" -ne 0 ]; then
  echo "⚠️  Please run as root or with sudo"
  echo "  sudo bash -c \"\$(curl -sSL https://bizclaw.vn/install.sh)\""
  exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  OS="unknown"
fi

echo "📦 OS detected: $OS ($PRETTY_NAME)"
echo "📦 Architecture: $(uname -m)"
echo ""

# ── Step 1: Install dependencies ────────────────────────────
echo "🔧 [1/5] Installing dependencies..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
  apt-get update -qq
  apt-get install -y -qq git curl build-essential pkg-config libssl-dev >/dev/null 2>&1
elif [ "$OS" = "fedora" ] || [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
  dnf install -y git curl gcc make openssl-devel >/dev/null 2>&1
else
  echo "⚠️  Unknown OS. Please install git, curl, gcc, openssl-dev manually."
fi
echo "  ✅ Dependencies installed"

# ── Step 2: Install Rust (if not present) ───────────────────
echo "🦀 [2/5] Checking Rust toolchain..."
if ! command -v cargo &>/dev/null; then
  echo "  📥 Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y >/dev/null 2>&1
  source "$HOME/.cargo/env"
  echo "  ✅ Rust installed: $(rustc --version)"
else
  source "$HOME/.cargo/env" 2>/dev/null || true
  echo "  ✅ Rust already installed: $(rustc --version)"
fi

# ── Step 3: Clone & build ───────────────────────────────────
echo "🔨 [3/5] Building BizClaw (this takes 2-5 minutes)..."
if [ -d "$INSTALL_DIR" ]; then
  cd "$INSTALL_DIR" && git pull origin master --quiet
else
  git clone --quiet "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Build ONLY the standalone binary (no PostgreSQL needed)
cargo build --release --bin bizclaw 2>&1 | tail -3
echo "  ✅ Build complete"

# ── Step 4: Install binary ─────────────────────────────────
echo "📦 [4/5] Installing binary..."
cp "$INSTALL_DIR/target/release/bizclaw" "$BIN_DIR/bizclaw"
chmod +x "$BIN_DIR/bizclaw"
echo "  ✅ bizclaw → $BIN_DIR/bizclaw ($(du -h $BIN_DIR/bizclaw | cut -f1))"

# Create data directory
mkdir -p "$DATA_DIR"

# Run init wizard if no config exists
if [ ! -f "$DATA_DIR/config.toml" ]; then
  echo ""
  echo "  📝 Running setup wizard..."
  "$BIN_DIR/bizclaw" init || true
fi

# ── Step 5: Setup systemd service ───────────────────────────
echo "🚀 [5/5] Setting up systemd service..."

cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=BizClaw AI Agent (Standalone)
After=network.target

[Service]
Type=simple
User=root
ExecStart=${BIN_DIR}/bizclaw serve --port 3000
Restart=always
RestartSec=5
Environment=RUST_LOG=info
Environment=BIZCLAW_CONFIG=${DATA_DIR}/config.toml

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}" >/dev/null 2>&1
systemctl restart "${SERVICE_NAME}"
sleep 2

# ── Done! ───────────────────────────────────────────────────
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "  ╔═══════════════════════════════════════════════════════╗"
echo "  ║  🎉  BizClaw installed successfully!                  ║"
echo "  ╠═══════════════════════════════════════════════════════╣"
echo "  ║                                                       ║"
echo "  ║  Dashboard:  http://${SERVER_IP}:3000                 ║"
echo "  ║  CLI Chat:   bizclaw chat                             ║"
echo "  ║  CLI Info:   bizclaw info                             ║"
echo "  ║                                                       ║"
echo "  ║  Status:     systemctl status ${SERVICE_NAME}         ║"
echo "  ║  Logs:       journalctl -u ${SERVICE_NAME} -f         ║"
echo "  ║  Config:     ${DATA_DIR}/config.toml                  ║"
echo "  ║                                                       ║"
echo "  ╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  💡 Next steps:"
echo "     1. Open the dashboard: http://${SERVER_IP}:3000"
echo "     2. Configure your AI provider in the dashboard"
echo "     3. Start chatting: bizclaw chat"
echo ""
echo "  📱 Optional — add Ollama for free local AI:"
echo "     curl -fsSL https://ollama.ai/install.sh | sh"
echo "     ollama pull qwen3:0.6b   # ~500MB, good for Pi"
echo ""
