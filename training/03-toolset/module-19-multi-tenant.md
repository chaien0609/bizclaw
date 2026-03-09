# 📖 Module 19: Multi-Tenant Platform & Security

> **Phase**: 🔧 TOOLSET | **Buổi**: 19/24 | **Thời lượng**: 2 giờ  
> **Skills**: `api-security-best-practices`, `vulnerability-scanner`

---

## 🎯 Mục Tiêu: Quản lý multi-tenant, JWT auth, security hardening

## 📋 Nội Dung

### 1. Multi-Tenant Architecture

```
bizclaw-platform (Port 3001)
├── Admin Dashboard: /admin/
├── Tenant 1: "Demo Bot" (Port 10001)
│   ├── Gateway + Dashboard
│   ├── Own SQLite DB
│   └── Own config.toml (auto-generated from DB)
├── Tenant 2: "Sales Bot" (Port 10002)
│   ├── Gateway + Dashboard
│   ├── Own SQLite DB
│   └── Own config.toml
└── Tenant N: ...

DB = Source of Truth → config.toml is generated artifact
```

### 2. Tenant Management

```bash
# Platform Admin API
GET  /api/admin/tenants/{id}/configs   → List tenant configs
POST /api/admin/tenants/{id}/configs   → Set tenant configs (batch)
GET  /api/admin/tenants/{id}/agents    → List tenant agents
POST /api/admin/tenants/{id}/agents    → Upsert agent
DELETE /api/admin/tenants/{id}/agents/{name} → Delete agent
```

### 3. Security Hardening

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT + bcrypt (password hashing) |
| **Authorization** | Per-tenant isolation, role-based |
| **Encryption** | AES-256 for secrets, API keys |
| **Transport** | HSTS, CSP, X-Frame-Options DENY |
| **Rate Limiting** | Login: 5 attempts/email/5min |
| **Error Handling** | `internal_error()` → generic messages |
| **CORS** | Strict by default, configurable |
| **Body Limit** | Platform: 1MB, Gateway: 5MB |
| **Pairing** | `constant_time_eq()` (anti-timing attack) |
| **Password** | Min 8 chars, unified across all endpoints |

### 4. Security Checklist

```
✅ JWT_SECRET set in production (not default)
✅ CORS restricted to known domains
✅ All API errors sanitized (internal_error helper)
✅ Body limits enforced (1MB/5MB)
✅ Security headers on ALL responses
✅ Rate limiting on login endpoint
✅ Password reset rate limited (3/15min)
✅ Login response: "Invalid credentials" (no enumeration)
✅ Bot tokens stored encrypted
✅ channels_sync.json: no real secrets
✅ channel_instances.json: chmod 600
✅ Platform binds 127.0.0.1 (reverse proxy only)
```

### 5. Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name apps.bizclaw.vn;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name demo.bizclaw.vn;
    
    location / {
        proxy_pass http://127.0.0.1:10001;
    }
    
    location /ws {
        proxy_pass http://127.0.0.1:10001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📝 Lab: Setup Multi-Tenant (30 phút)

1. Start bizclaw-platform
2. Login as admin (admin@bizclaw.vn)
3. Create 2 tenants
4. Configure different providers per tenant
5. Test tenant isolation (Tenant A can't see Tenant B data)
6. Verify security headers in browser DevTools

---

## ⏭️ **Module 20: Deploy Production & Monitoring**
