# 📖 Module 15: Communication Channels — Telegram & Discord

> **Phase**: 🔧 TOOLSET | **Buổi**: 15/24 | **Thời lượng**: 2 giờ  
> **Skills**: `telegram-bot-builder`, `discord-bot-builder`

---

## 🎯 Mục Tiêu: Kết nối agent với Telegram và Discord

## 📋 Nội Dung

### 1. Telegram Bot Setup

#### 1.1 Tạo Bot

```
1. Chat @BotFather trên Telegram
2. /newbot → Đặt tên "BizClaw Sales Bot"
3. Nhận token: 7234567890:AAH...
4. Dashboard → Channels → Telegram → Paste token → Enable → Save
```

#### 1.2 How It Works

```
Telegram User → Message → Telegram API → Long Polling
                                            ↓
                                    BizClaw Channel
                                            ↓
                                    Agent Runtime
                                            ↓
                                    Response → Telegram
```

- **Long Polling**: BizClaw liên tục hỏi Telegram "có tin nhắn mới?"
- **No Webhook needed**: Không cần public URL (perfect for Pi/home server)
- **Bidirectional**: ✅ LIVE — send + receive

#### 1.3 Telegram Commands

```
/start  → Welcome message
/help   → Show available commands
/clear  → Clear conversation history
/model  → Show current provider/model
[any text] → Send to agent
```

### 2. Discord Bot Setup

#### 2.1 Tạo Bot

```
1. https://discord.com/developers/applications → New Application
2. Bot → Reset Token → Copy token
3. OAuth2 → URL Generator → bot + Send Messages + Read Message History
4. Invite bot to server
5. Dashboard → Channels → Discord → Paste token → Enable → Save
```

#### 2.2 How It Works

```
Discord User → Message → Discord Gateway (WebSocket)
                                    ↓
                            BizClaw Channel
                                    ↓
                            Agent Runtime
                                    ↓
                            Response → Discord API → Channel
```

- **Gateway WebSocket**: Persistent connection, real-time
- **REST + Gateway**: Bidirectional ✅ READY

### 3. Channel Configuration (Dashboard)

```
Dashboard → Channels

┌──────────────────────────────────────────────┐
│ 📱 Telegram                                   │
│ Bot Token: 7234••••     Status: ✅ Connected  │
│ [Enable] [Test] [Disconnect]                  │
├──────────────────────────────────────────────┤
│ 💜 Discord                                    │
│ Bot Token: MTIz••••     Status: ✅ Connected  │
│ [Enable] [Test] [Disconnect]                  │
├──────────────────────────────────────────────┤
│ 📧 Email        Status: ⚪ Not configured     │
│ 🔗 Webhook      Status: ✅ Ready              │
│ 📱 WhatsApp     Status: ⚪ Not configured     │
│ 💬 Zalo         Status: ⚪ Not configured     │
└──────────────────────────────────────────────┘
```

### 4. Security Notes

- Bot tokens stored encrypted (AES-256)
- API shows masked tokens: `ABCD••••`
- `channel_instances.json` → chmod 600
- `channels_sync.json` → NEVER contains real tokens

### 5. Multi-Channel Same Agent

```
1 Agent can respond on:
  ├── Telegram  → Bot for customers
  ├── Discord   → Internal team channel
  ├── Web Chat  → Dashboard chat
  └── CLI       → Developer testing

Same brain, same tools, same knowledge — different channels.
```

---

## 📝 Lab: Connect Telegram Bot (30 phút)

1. Create bot via @BotFather
2. Configure in Dashboard
3. Send test message from Telegram
4. Verify agent responds correctly
5. Try shell tool: "List files in current directory"

---

## ⏭️ **Module 16: Advanced Channels (Email, Zalo, WhatsApp)**
