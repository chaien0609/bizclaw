# BizClaw System Architecture — v0.3.2

## Overview

BizClaw is a self-hosted AI Agent platform built 100% in Rust.
Single binary (~13MB) runs on any device from Raspberry Pi (512MB RAM) to cloud VPS.
Now available as **Desktop App** for macOS, Windows, and Linux.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│              bizclaw (Gateway + Dashboard)                │
│  ┌─────────────────────────────────────────────────┐     │
│  │  Axum HTTP + WebSocket + Dashboard UI (Preact)  │     │
│  │  SQLite gateway.db (embedded, per-tenant)       │     │
│  │  Security Headers + Rate Limiting + CORS        │     │
│  └──────────────────┬──────────────────────────────┘     │
│     ┌───────────────┼───────────────────┐                │
│     ▼               ▼                   ▼                │
│  bizclaw-agent   bizclaw-agent       bizclaw-agent       │
│  (Orchestrator manages N agents per tenant)              │
│     │                                                    │
│  ┌──┼──────────────────────────────────────────┐        │
│  │  ▼               ▼              ▼           │        │
│  │ 16 Providers   9 Channels    13 Tools + MCP │        │
│  │  (OpenAI,       (Telegram,    (Shell*,      │        │
│  │   Anthropic,     Discord,      File*,       │        │
│  │   Gemini,        Zalo,         Execute*,    │        │
│  │   Ollama,        Email,        Web Search,  │        │
│  │   llama.cpp)     WhatsApp)     HTTP, ...)   │        │
│  │                                * = secured  │        │
│  └──┬──────────────────────────────────────────┘        │
│     │                                                    │
│  ┌──┼──────────────────────────────────────────┐        │
│  │  ▼               ▼              ▼           │        │
│  │ Memory         Security      Knowledge      │        │
│  │ (SQLite+FTS5)  (Allowlist,   (Hybrid RAG:   │        │
│  │                 Injection     FTS5 + Vector  │        │
│  │                 Scanner,      Cosine Sim)    │        │
│  │                 CBC Encrypt)                 │        │
│  └──┬──────────────────────────────────────────┘        │
│     ▼                                                    │
│  Brain Engine (GGUF+SIMD) — offline inference            │
│  Scheduler (Cron/Interval + Workflow Rules)               │
└──────────────────────────────────────────────────────────┘
```

## Crate Map (19 crates)

| Crate | LOC | Purpose | Security |
|-------|-----|---------|----------|
| `bizclaw-core` | ~3,500 | Traits, types, config, errors | — |
| `bizclaw-brain` | ~4,200 | GGUF inference + SIMD | — |
| `bizclaw-providers` | ~4,800 | 16 LLM providers | API key encryption |
| `bizclaw-channels` | ~5,600 | 9 channel adapters | Rate limiting |
| `bizclaw-memory` | ~2,100 | SQLite + FTS5, Brain workspace | — |
| `bizclaw-tools` | ~5,900 | 13 native tools + MCP bridge | **Shell/File/Code validation** |
| `bizclaw-mcp` | ~1,800 | MCP client (JSON-RPC 2.0) | — |
| `bizclaw-security` | ~1,200 | AES-256-CBC, Sandbox, Injection | **Core security module** |
| `bizclaw-agent` | ~2,800 | Think-Act-Observe loop | **Injection guardrail** |
| `bizclaw-gateway` | ~7,200 | HTTP + WS + Dashboard + JWT | **Headers, CORS, Rate limit, JWT SSO** |
| `bizclaw-knowledge` | ~1,500 | Hybrid RAG (FTS5 + Vector) | FTS5 query sanitization |
| `bizclaw-scheduler` | ~2,400 | Cron tasks + Workflow rules | — |
| `bizclaw-runtime` | ~800 | Agent lifecycle management | — |
| `bizclaw-platform` | ~7,400 | Multi-tenant admin server | JWT auth, bcrypt |
| `bizclaw-db` | ~2,800 | PostgreSQL + SQLite abstraction | Parameterized queries |
| `bizclaw-hands` | ~1,500 | Android device tools | — |
| `bizclaw-workflows` | ~600 | Workflow orchestration | — |
| `bizclaw-skills` | ~400 | Agent skill modules | — |
| `bizclaw-ffi` | ~300 | Android FFI layer | — |

## Security Architecture (v0.3.2)

### Defense-in-Depth Layers

```
Layer 1: Network
  ├── Nginx reverse proxy (SSL termination)
  ├── CORS whitelist (5 domains, env var)
  └── Rate limiting (60 req/min per IP)

Layer 2: Authentication 
  ├── JWT SSO (HS256, shared secret between Platform ↔ Gateway)
  │   ├── Authorization: Bearer <token>
  │   ├── Cookie: bizclaw_token=<token>
  │   └── Query: ?token=<token>
  ├── Legacy pairing code (constant-time comparison, disabled by default)
  ├── JWT HS256 (24h expiry, persistent secret)
  └── bcrypt (cost=12) password hashing

Layer 3: Application
  ├── Security Headers (HSTS, CSP, X-Frame-Options)
  ├── Body size limit (5MB)
  └── Mutex poisoning recovery

Layer 4: Agent Pipeline
  ├── InjectionScanner (6 pattern categories)
  ├── Guardrail injection on suspicious prompts
  └── Tool loop detection

Layer 5: Tool Execution
  ├── ShellTool: metachar blocking + dangerous patterns + env_clear + timeout
  ├── FileTool: path validation + traversal detection + write protection
  ├── ExecuteCodeTool: code content scanner (16 patterns)
  └── SecurityPolicy: command allowlist + forbidden paths

Layer 6: Data at Rest
  ├── AES-256-CBC (random IV per encryption)
  ├── HMAC-SHA256 key derivation
  └── File permissions (0600)
```

### Encryption

| Component | Algorithm | Key Derivation |
|-----------|-----------|---------------|
| Secrets store | AES-256-CBC | HMAC-SHA256(hostname+username) |
| API keys | AES-256 (in secrets.enc) | Same as above |
| Passwords | bcrypt cost=12 | Salt per hash |
| JWT tokens | HS256 | Shared JWT_SECRET env var |

## Deployment Architecture — 3 Modes

### Mode 1: Desktop App (NEW — v0.3.2)
```
macOS / Windows / Linux
  └── bizclaw-desktop (13MB single executable)
        ├── Embedded gateway server
        ├── SQLite databases
        ├── Auto-opens browser to http://127.0.0.1:<port>
        ├── Data dir: ~/.bizclaw/
        └── Zero configuration required
```

### Mode 2: Single-Tenant (Standalone)
```
Device (Pi/Laptop/VPS)
  └── bizclaw binary (13MB)
        ├── SQLite databases (embedded)
        ├── config.toml
        └── secrets.enc (AES-256-CBC)
```

### Mode 3: Multi-Tenant Cloud + PaaS (Hybrid)
```
Cloud VPS (apps.bizclaw.vn)
  ├── Nginx (SSL, reverse proxy)
  ├── Docker
  │   ├── bizclaw-platform (port 3001)
  │   │   ├── Admin Dashboard
  │   │   ├── Tenant Manager (spawn/stop/restart)
  │   │   ├── Server Provisioner (SSH to remote VPS)
  │   │   ├── Health Monitor (60s interval)
  │   │   ├── JWT SSO (shared secret with gateways)
  │   │   └── bizclaw serve (per tenant, ports 10001+)
  │   └── PostgreSQL 16 (port 5432)
  ├── bizclaw.vn landing
  └── viagent.vn landing

PaaS Remote Nodes (customer VPS)
  └── bizclaw (standalone, installed via SSH)
        ├── Provisioned from Cloud Platform
        ├── JWT SSO (shared JWT_SECRET)
        ├── Health monitored every 60s
        └── Admin manages via Cloud dashboard
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BIZCLAW_CONFIG` | Path to config.toml | ❌ | `~/.bizclaw/config.toml` |
| `DATABASE_URL` | PostgreSQL connection (multi-tenant) | ❌ | SQLite |
| `JWT_SECRET` | Shared JWT secret (Platform ↔ Gateway) | ❌ | Auto-generated |
| `RUST_LOG` | Log level | ❌ | `info` |
| `BIZCLAW_BIND_ALL` | Bind 0.0.0.0 (Docker) | ❌ | `false` |
| `TZ` | Timezone | ❌ | System |

## Cross-Platform Build Targets

| Platform | Binary | Format | Size |
|----------|--------|--------|------|
| macOS (ARM64) | `bizclaw-desktop` | `.dmg` | ~20MB |
| macOS (Intel) | `bizclaw-desktop` | `.dmg` | ~20MB |
| Windows x64 | `bizclaw-desktop.exe` | `.zip` | ~15MB |
| Linux x64 | `bizclaw-desktop` | `.deb` | ~26MB |
| Docker | `bizclaw-platform` | Container | ~100MB |
| Android | BizClaw App | `.apk` | ~25MB |

## CI/CD Pipeline

GitHub Actions workflow: `.github/workflows/release-desktop.yml`
- Triggered by tag push (`v*`)
- Builds 4 platform targets in parallel
- Creates GitHub Release with all artifacts
- Docker build via manual deploy to VPS
