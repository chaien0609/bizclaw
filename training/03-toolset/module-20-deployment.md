# 📖 Module 20: Deploy Production & Monitoring

> **Phase**: 🔧 TOOLSET | **Buổi**: 20/24 | **Thời lượng**: 2 giờ  
> **Skills**: `deployment-procedures`, `devops`, `server-management`

---

## 🎯 Mục Tiêu: Deploy BizClaw lên VPS, monitoring, và troubleshooting

## 📋 Nội Dung

### 1. Deployment Flow

```
Local Dev → Git Push → SSH VPS → Git Pull → Build → Restart

Cụ thể:
1. git push origin main
2. ssh root@116.118.2.98
3. cd /root/bizclaw
4. source ~/.cargo/env
5. git pull
6. cargo build --release
7. systemctl restart bizclaw-platform
8. systemctl status bizclaw-platform ← verify
```

### 2. Three Deployment Targets

| Target | Chi phí | RAM | Binary Size | Use Case |
|--------|---------|-----|-------------|----------|
| 🍓 Raspberry Pi 4/5 | $0/tháng | 2-8 GB | 12 MB | Home office, offline |
| 📱 Android | $0/tháng | 2+ GB | ~8 MB APK | Mobile agent, 24/7 |
| 🖥️ VPS | 150-500K/tháng | 2+ GB | 12+7.7 MB | Multi-tenant, production |

### 3. Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  bizclaw:
    build: .
    ports:
      - "3579:3579"
    volumes:
      - ./data:/root/.bizclaw
    environment:
      - JWT_SECRET=your-production-secret
      - BIZCLAW_CORS_ORIGINS=https://your-domain.com
    restart: always
    
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: always
```

### 4. Monitoring Checklist

```
┌─────────────────────────────────────────────────┐
│  Production Monitoring                           │
│                                                  │
│  ✅ systemd service running                      │
│  ✅ Dashboard accessible (port check)            │
│  ✅ WebSocket connection working                 │
│  ✅ At least 1 provider responding               │
│  ✅ Channels connected (Telegram etc.)           │
│  ✅ LLM Traces recording                        │
│  ✅ Disk space > 20%                             │
│  ✅ RAM usage < 80%                              │
│  ✅ SSL certificate valid                        │
│  ✅ Nginx proxy working                          │
└─────────────────────────────────────────────────┘
```

### 5. Common Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| "Text file busy" | Service still running | `systemctl stop` first |
| Binary can't run on VPS | macOS ≠ Linux | Build ON the VPS |
| localhost in tenant links | Dashboard hardcoded | Use `location.hostname` |
| cargo not found (SSH) | PATH not set | `source ~/.cargo/env` |
| DB deadlock | No WAL mode | Enable `PRAGMA journal_mode=WAL` |
| `type="email"` Safari bug | Safari tooltip | Use `type="text" inputmode="email"` |

### 6. Rollback Strategy

```bash
# Emergency rollback
ssh root@your-vps

# Option 1: Git revert
cd /root/bizclaw
git log --oneline -5  # find working commit
git checkout abc1234  # checkout working version
cargo build --release
systemctl restart bizclaw-platform

# Option 2: Backup binary
cp /root/bizclaw/target/release/bizclaw-platform /root/backup/
# If new version fails:
cp /root/backup/bizclaw-platform /root/bizclaw/target/release/
systemctl restart bizclaw-platform
```

---

## 📝 Lab: Deploy to VPS (45 phút)

1. Build release binaries
2. Setup systemd service
3. Configure Nginx reverse proxy
4. Setup SSL with Let's Encrypt
5. Test all channels from production URL
6. Document deployment procedure for your team

---

## ⏭️ **Module 21: Capstone Project — Design Phase**
