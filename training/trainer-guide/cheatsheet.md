# 🔥 BizClaw Cheatsheet — 1-Page Quick Reference

> **Dành cho Trainer** — In ra mang theo khi triển khai

---

## ⚡ Commands

```bash
# Cài đặt
cargo build --release
./target/release/bizclaw serve --port 3579
./target/release/bizclaw-platform --port 3001

# Ollama
ollama pull qwen3
ollama pull llama3.2
ollama list

# Systemd
sudo systemctl start bizclaw-platform
sudo systemctl stop bizclaw-platform
sudo systemctl status bizclaw-platform
sudo journalctl -u bizclaw-platform -f  # live logs

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose restart
```

## 📊 Key Numbers

| Item | Value |
|------|-------|
| Crates | 17 |
| Providers | 15 |
| Channels | 9 |
| Tools | 13 |
| Agent Templates | 51 |
| Dashboard Pages | 15 |
| Binary (bizclaw) | 12 MB |
| Binary (platform) | 7.7 MB |
| Tests | 240 passing |
| Audit Score | 91/100 |

## 💰 Provider Pricing (per 1000 req)

| Provider | ~Cost/1K req | Best For |
|----------|-------------|----------|
| Ollama | $0 | Offline, demo |
| Groq | $0 (free tier) | Fast |
| Gemini Flash | $0.28 | Budget |
| DeepSeek | $0.41 | Vietnamese |
| GPT-4o-mini | $0.55 | General |
| GPT-4o | $6.50 | Quality |
| Claude 3.5 | $9.30 | Reasoning |

## 🛠️ System Prompt Template

```
# ROLE — Ai
# CONTEXT — Bối cảnh
# INSTRUCTIONS — 5 nhiệm vụ
# CONSTRAINTS — 3 điều KHÔNG
# OUTPUT FORMAT — Ngôn ngữ, độ dài
# EXAMPLES — 2-3 ví dụ
```

## 🔌 Channel Setup

| Channel | 1: Tạo | 2: Get Token | 3: Dashboard |
|---------|--------|-------------|-------------|
| Telegram | @BotFather /newbot | Copy token | Paste → Enable |
| Discord | discord.com/developers | Bot → Token | Paste → Enable |
| Email | Gmail App Password | IMAP/SMTP | Enter creds |

## 🔒 Security Checklist

```
□ JWT_SECRET set (not default)
□ CORS restricted
□ Body limits (1MB/5MB)
□ Security headers
□ Rate limiting
□ Error sanitization
□ Token encryption (AES-256)
```

## 🚨 Troubleshooting

| Problem | Fix |
|---------|-----|
| Dashboard empty | Clear cache, hard refresh |
| Bot no response | Check token, restart service |
| "Text file busy" | Stop service before rebuild |
| cargo not found | `source ~/.cargo/env` |
| Slow response | Switch to Groq/Gemini Flash |
| DB locked | Enable WAL: `PRAGMA journal_mode=WAL` |

## 📞 Ports

| Service | Port |
|---------|------|
| Standalone | 3579 |
| Platform | 3001 |
| Tenant 1 | 10001 |
| Tenant 2 | 10002 |
| Ollama | 11434 |
