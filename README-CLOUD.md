# ⚡ BizClaw Cloud — Multi-Tenant AI Agent Platform

<p align="center">
  <img src="docs/images/hero-banner.png" alt="BizClaw Cloud — AI Agent Platform" width="800">
</p>

<p align="center">
  <strong>Nền tảng AI Agent multi-tenant cho doanh nghiệp. Quản lý hàng trăm AI agents trên 1 dashboard.</strong><br>
  Cloud SaaS (bizclaw.vn / viagent.vn) • VPS Multi-Tenant • Enterprise
</p>

> **BizClaw Cloud** là phiên bản thương mại multi-tenant của BizClaw. Triển khai trên VPS hoặc Cloud, quản lý nhiều tenants, khách hàng, và AI agents từ 1 Admin Dashboard duy nhất.

> ⚠️ **Private Repository** — Repo này chứa code multi-tenant, admin platform, và Cloud SaaS features. Repo public (single-tenant) tại [github.com/nguyenduchoai/bizclaw](https://github.com/nguyenduchoai/bizclaw).

[![Rust](https://img.shields.io/badge/Rust-100%25-orange?logo=rust)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()
[![Multi-Tenant](https://img.shields.io/badge/Multi--Tenant-PostgreSQL-blue)]()

---

## 🏗️ Kiến trúc Cloud

```
┌─────────────────────────────────────────────────────────┐
│              bizclaw-platform (Admin Dashboard)          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ Tenant 1│ │ Tenant 2│ │ Tenant N│  ← JWT + Audit Log │
│  └────┬────┘ └────┬────┘ └────┬────┘                   │
│       └───────────┼───────────┘                         │
│                   ▼                                     │
│            bizclaw (Gateway per tenant)                  │
│  ┌────────────────────────────────────────┐             │
│  │ Axum HTTP + WebSocket + Dashboard      │             │
│  │ SQLite gateway.db (per-tenant)         │             │
│  └────────────────┬───────────────────────┘             │
│    ┌──────────────┼──────────────┐                      │
│    ▼              ▼              ▼                      │
│ 16 Providers   9 Channels    13 Tools + MCP             │
│    ▼              ▼              ▼                      │
│ Memory         Security      Knowledge                  │
│  (SQLite+FTS5) (Allowlist)   (RAG+FTS5)                 │
│    ▼                                                    │
│ Brain Engine (GGUF+SIMD) — offline inference            │
└─────────────────────────────────────────────────────────┘

VPS: 116.118.2.98
├── bizclaw-app (port 3001) → bizclaw.vn
├── viagent-app (port 3002) → viagent.vn
├── bizclaw-db  (PostgreSQL 5432)
└── Nginx (SSL, subdomain routing)
```

---

## 🌐 Domains hiện tại

| Domain | Loại | Service |
|--------|------|---------|
| **bizclaw.vn** | Landing page | `/var/www/bizclaw-landing` |
| **apps.bizclaw.vn** | Admin Platform | port 3001 |
| **\*.bizclaw.vn** | Tenant subdomains | dynamic routing |
| **viagent.vn** | Landing page | `/var/www/viagent-landing` |
| **apps.viagent.vn** | Admin Platform | port 3002 |
| **\*.viagent.vn** | Tenant subdomains | dynamic routing |

---

## 🚀 Deploy lên VPS

### Quick Deploy (từ local)

```bash
# 1. Push code
git push cloud master

# 2. SSH và pull trên VPS
ssh root@116.118.2.98 "cd /opt/bizclaw && git pull"

# 3. Rebuild Docker
ssh root@116.118.2.98 "cd /opt/bizclaw && docker build -t bizclaw_bizclaw ."

# 4. Restart containers
ssh root@116.118.2.98 "docker restart bizclaw-app viagent-app"
```

### Docker Containers

```bash
# bizclaw-app (port 3001) — bizclaw.vn
docker run -d --name bizclaw-app --network host --restart unless-stopped \
  -v /root/.bizclaw:/root/.bizclaw \
  -e DATABASE_URL=postgres://bizclaw:PASSWORD@127.0.0.1:5432/bizclaw \
  -e JWT_SECRET=bizclaw-prod-jwt-secret-2026 \
  -e BIZCLAW_CORS_ORIGINS=https://bizclaw.vn,https://apps.bizclaw.vn \
  bizclaw_bizclaw --port 3001 --domain bizclaw.vn

# viagent-app (port 3002) — viagent.vn
docker run -d --name viagent-app --network host --restart unless-stopped \
  -v /root/.viagent:/root/.bizclaw \
  -e DATABASE_URL=postgres://bizclaw:PASSWORD@127.0.0.1:5432/bizclaw \
  -e JWT_SECRET=viagent-prod-jwt-secret-2026 \
  -e BIZCLAW_CORS_ORIGINS=https://viagent.vn,https://apps.viagent.vn \
  bizclaw_bizclaw --port 3002 --domain viagent.vn
```

---

## 📦 Tính năng Cloud (khác với Public)

| Tính năng | Public (Single) | Cloud (Private) |
|-----------|-----------------|-----------------|
| **Multi-Tenant** | ❌ | ✅ Admin Dashboard, JWT Auth |
| **PostgreSQL** | ❌ SQLite only | ✅ Connection pooling, 19 tables |
| **Subdomain Routing** | ❌ | ✅ Nginx dynamic routing |
| **User Management** | ❌ | ✅ RBAC, audit log |
| **Tenant Provisioning** | ❌ | ✅ Tạo tenant + subdomain tự động |
| **Cloud SaaS** | ❌ | ✅ bizclaw.vn + viagent.vn |
| **Landing Pages** | ❌ | ✅ 2 landing pages với Cloud pricing |
| **Pricing Packages** | ❌ | ✅ Starter / Business / Enterprise |
| **Pairing Codes** | ❌ | ✅ Per-tenant pairing |
| **SSL/Nginx** | ❌ | ✅ Let's Encrypt auto |
| **Ollama Sharing** | ❌ | ✅ Tất cả tenants dùng chung |

---

## 📊 Git Workflow

```
LOCAL (workspace: /Users/digits/Github/bizclaw/)
  │
  ├── git push origin master  → PUBLIC repo (single-tenant only)
  │                              github.com/nguyenduchoai/bizclaw
  │                              ⚠️ README.md = single-tenant
  │                              ⚠️ README-CLOUD.md phải XOÁ trước khi push
  │
  └── git push cloud master   → PRIVATE repo (full cloud)
                                 github.com/nguyenduchoai/bizclaw-cloud
                                 README-CLOUD.md = multi-tenant guide
```

---

## 🏢 3 Chế Độ Triển Khai

| Mode | Binary | Yêu cầu | Use Case |
|------|--------|---------|----------|
| 🍓 **Standalone** | `bizclaw` only | 512MB RAM, SQLite | 1 bot, cá nhân — **PUBLIC REPO** |
| 🖥️ **Platform** | `bizclaw` + `bizclaw-platform` | 2GB+ RAM, PostgreSQL | Multi-tenant — **PRIVATE REPO** |
| ☁️ **Cloud** | Platform + Nginx + Docker | VPS + domain | SaaS — **PRIVATE REPO** |

---

## 📝 Gói Cloud SaaS

| Gói | Giá | Agents | Channels | Hỗ trợ |
|-----|-----|--------|----------|--------|
| **Starter** | 499K/tháng | 3 | 1 | Email |
| **Business** ⭐ | 1.5M/tháng | 10 | 5 | Zalo + Onboarding |
| **Enterprise** | Liên hệ | ∞ | All | VPS riêng, SLA 99.9% |

---

## 📱 Liên hệ

- **Zalo:** 0888 468 988
- **Email:** hello@bizclaw.vn
- **Website:** [bizclaw.vn](https://bizclaw.vn) | [viagent.vn](https://viagent.vn)

---

**BizClaw Cloud** v0.3.0 — *Nền tảng AI Agent cho doanh nghiệp Việt Nam.*
