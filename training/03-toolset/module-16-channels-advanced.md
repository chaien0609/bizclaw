# 📖 Module 16: Advanced Channels — Email, Zalo, WhatsApp, Webhook

> **Phase**: 🔧 TOOLSET | **Buổi**: 16/24 | **Thời lượng**: 2 giờ

---

## 🎯 Mục Tiêu: Kết nối Email (IMAP/SMTP), Zalo, WhatsApp, Webhook

## 📋 Nội Dung

### 1. Email Channel (IMAP + SMTP)

```toml
[[channels]]
type = "email"
imap_server = "imap.gmail.com"
smtp_server = "smtp.gmail.com"
email = "agent@company.vn"
password = "app-specific-password"
poll_interval = 60  # seconds
enabled = true
```

- **IMAP Polling**: Sync check every 60s for new emails
- **SMTP Sending**: Async via lettre library
- **Use case**: Support tickets, automated responses

### 2. Zalo Integration

| Mode | Type | Status |
|------|------|--------|
| Zalo Personal | Reverse-engineered API | Framework ready |
| Zalo Official Account | Official Business API | Framework ready |

```toml
[[channels]]
type = "zalo_personal"
cookies = "..."     # Zalo web cookies
enabled = true
```

### 3. WhatsApp Business API

```toml
[[channels]]
type = "whatsapp"
phone_number_id = "123456789"    # NOT "phone_id"
webhook_verify_token = "secret"  # NOT "webhook_secret"
access_token = "EAAx..."
enabled = true
```

⚠️ **Gotcha**: Field names must be exact — `phone_number_id` not `phone_id`

### 4. Webhook Channel (Generic)

```toml
[[channels]]  
type = "webhook"
url = "https://hooks.example.com/callback"
secret = "hmac-secret-key"
enabled = true
```

- **Inbound**: External systems POST to BizClaw `/webhook/inbound`
- **Outbound**: BizClaw POST response to configured URL
- **Security**: HMAC-SHA256 signature verification
- ⚠️ Inbound route must be in PUBLIC router (not behind auth)

### 5. Channel Architecture Summary

```
9 Channels:
├── ✅ LIVE (Bidirectional)
│   ├── CLI      → Terminal REPL
│   ├── Telegram → Bot API + Long Polling
│   ├── Discord  → REST + Gateway WebSocket
│   └── Webhook  → Generic HTTP
│
├── 🟡 Framework Ready
│   ├── Email    → IMAP + SMTP (lettre)
│   ├── WhatsApp → Business API
│   ├── Zalo     → Personal + Official
│   └── Web Chat → WebSocket Dashboard
│
└── 📱 Android
    └── Accessibility Service → Facebook/Messenger/Zalo
```

---

## 📝 Lab: Setup Email Channel (20 phút)

1. Configure Gmail IMAP/SMTP with app-specific password
2. Enable in Dashboard
3. Send test email to agent address
4. Verify agent reads and responds

---

## ⏭️ **Module 17: Agent Templates & System Prompts**
