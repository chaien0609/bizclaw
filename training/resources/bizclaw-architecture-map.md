# 🗺️ BizClaw Architecture Map — Tham Chiếu Nhanh

## Crate Dependencies

```
bizclaw (CLI binary)
└── bizclaw-gateway
    ├── bizclaw-agent (runtime)
    │   ├── bizclaw-core (traits)
    │   ├── bizclaw-providers (15 LLMs)
    │   ├── bizclaw-tools (13 tools)
    │   ├── bizclaw-memory (3-tier)
    │   ├── bizclaw-knowledge (RAG)
    │   ├── bizclaw-mcp (client)
    │   └── bizclaw-security (AES-256)
    ├── bizclaw-channels (9 types)
    ├── bizclaw-scheduler (cron)
    └── bizclaw-db (SQLite/PostgreSQL)

bizclaw-platform (Admin binary)
└── bizclaw-core
    └── bizclaw-db
```

## Data Flow

```
User Message → Channel → Agent Runtime
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              Brain Work   Tool      Knowledge
              (Memory)    Execution    (RAG)
                    │         │         │
                    └─────────┼─────────┘
                              ▼
                         LLM Provider
                              │
                              ▼
                    Think-Act-Observe
                    (max 5 rounds)
                              │
                              ▼
                       Quality Gate
                              │
                              ▼
                       Response → Channel → User
```

## File System Layout

```
~/.bizclaw/                    # User workspace
├── config.toml                # Agent configuration
├── SOUL.md                    # Personality
├── IDENTITY.md                # Agent identity
├── USER.md                    # Human context
├── MEMORY.md                  # Curated knowledge
├── TOOLS.md                   # Environment notes
├── memory/                    # Daily compaction logs
│   └── 2026-02-28.md
├── gateway.db                 # SQLite (agents, providers, channels)
├── knowledge.db               # Knowledge RAG database
└── conversations.db           # FTS5 conversation search

/root/bizclaw/                 # Source code (VPS)
├── target/release/
│   ├── bizclaw                # CLI binary (12 MB)
│   └── bizclaw-platform       # Platform binary (7.7 MB)
├── crates/                    # 17 Rust crates
└── landing/                   # bizclaw.vn website
```

## Port Allocation

| Service | Port | Purpose |
|---------|------|---------|
| bizclaw-platform | 3001 | Admin dashboard |
| Tenant 1 (Demo) | 10001 | Demo bot gateway |
| Tenant 2 (Sales) | 10002 | Sales bot gateway |
| bizclaw standalone | 3579 | Single-mode gateway |
| Ollama | 11434 | Local LLM inference |

## API Quick Reference

```
# System
GET  /api/v1/info              → System info
GET  /api/v1/config            → Config (masked secrets)
POST /api/v1/config/update     → Update config

# Providers
GET  /api/v1/providers         → List providers
GET  /api/v1/ollama/models     → Ollama models
GET  /api/v1/brain/models      → GGUF models

# Agents
GET  /api/v1/agents            → List agents
POST /api/v1/agents            → Create agent
DELETE /api/v1/agents/{name}   → Delete agent
POST /api/v1/agents/{name}/chat→ Chat with agent
POST /api/v1/agents/broadcast  → Broadcast to all

# Knowledge
POST /api/v1/knowledge/search  → Search docs
GET  /api/v1/knowledge/documents → List docs
POST /api/v1/knowledge/documents → Upload doc
DELETE /api/v1/knowledge/documents/{id} → Remove doc

# Channels
GET  /api/v1/channels          → List channels
POST /api/v1/channels/update   → Update channel

# WebSocket
WS   /ws?code={pairing_code}   → Real-time chat
```
