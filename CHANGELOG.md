# Changelog

## [0.3.2] — 2026-03-08

### Added
- **🖥️ Desktop App**: `bizclaw-desktop` binary — single 13MB executable
  - Auto-opens browser to dashboard on startup
  - Random port allocation (or `--port N`)
  - Data stored in `~/.bizclaw/` (cross-platform)
  - Zero configuration — works out of the box
  - CLI: `--port`, `--no-open`, `--help` flags
- **🔑 JWT SSO**: Gateway accepts Platform JWT tokens for seamless auth
  - 3 methods: `Authorization: Bearer`, Cookie `bizclaw_token`, URL `?token=`
  - Shared `JWT_SECRET` env var between Platform and Gateway
  - `JwtClaims` struct: sub, email, role, tenant_id, exp
  - `validate_jwt()` helper function using HS256
  - `verify-pairing` endpoint accepts both `{token:JWT}` and `{code:PIN}`
- **🔨 GitHub Actions CI/CD**: `.github/workflows/release-desktop.yml`
  - macOS Apple Silicon (.dmg) — ~20MB
  - macOS Intel (.dmg) — cross-compiled
  - Windows x64 (.zip) — ~15MB
  - Linux x64 (.deb) — ~26MB
  - Auto-creates GitHub Release on tag push

### Changed
- **Pairing code**: `require_pairing` now defaults to `false` (JWT is primary auth)
- **Dashboard frontend**: Auth helpers support both JWT and legacy pairing code
  - `getJwtToken()`: extracts from URL `?token=`, cookie, or sessionStorage
  - `authFetch()`: sends Bearer token or X-Pairing-Code header
  - WebSocket: passes JWT via `?token=` query param
- **README**: 5 deployment modes (Desktop, Source, Docker, Cloud, PaaS)
  - Download table with release links for macOS/Windows/Linux
  - New features documented: Desktop App, Cloud Platform, JWT SSO
- **Architecture docs**: Updated to v0.3.2 with 3-mode deployment diagram

### Security
- JWT validation using constant-time comparison
- Brute-force protection for auth attempts
- Token cleanup on 401 response (clear sessionStorage)

## [0.3.2-pre] — 2026-03-06

### Added
- **Dropdown Selects**: Provider/Model selection now uses `<select>` dropdown populated from `/api/v1/providers`
  - SettingsPage: Provider + Model dropdowns with auto-populate models based on selected provider
  - AgentsPage: Provider + Model dropdowns in create/edit agent form
  - OrchestrationPage: From/To Agent dropdowns populated from `/api/v1/agents`
  - All selects include "✏️ Nhập thủ công..." fallback option for custom values
- **Multi-instance Channels**: ChannelsPage now supports multiple instances per channel type
  - "➕ Thêm kênh" button with channel type selector dropdown
  - Per-instance naming (e.g., "Bot bán hàng", "Zalo cá nhân 2")
  - Supports: Telegram, Zalo, Discord, Email, Webhook (multi:true)
  - Display name field in channel config form
- **🐕 Watchdog Script**: `scripts/watchdog.sh` — Auto-kill hung terminal processes
  - `--status`: Show running BizClaw processes
  - `--kill-all`: Emergency kill everything
  - `--daemon`: Background watchdog (check every 60s)
  - `--dry-run`: Preview what would be killed
  - Configurable: `WATCHDOG_MAX_MINUTES=20` env var
- **Workflow `/watchdog`**: Slash command for quick process management

### Changed
- **Shell timeout**: 30s → 900s (15 minutes) — prevents premature command termination
  - `crates/bizclaw-tools/src/shell.rs`: Configurable via `timeout_secs` parameter or `BIZCLAW_SHELL_TIMEOUT_SECS` env var
  - `crates/bizclaw-runtime/src/lib.rs`: NativeRuntime + SandboxedRuntime both upgraded
  - Per-call timeout support: up to 3600s (1 hour) max
- **Improved timeout messages**: Now show elapsed minutes alongside seconds
- **4 files modified**: app.js (+344 lines), shell.rs, lib.rs (runtime), Cargo.lock

## [0.3.1] — 2026-03-06

### Fixed
- **CRITICAL**: Preact dual-instance hazard — navigation clicks now work on ALL pages
  - Root cause: `hooks.mjs` imported `options` from separate `preact.mjs` module, creating two Preact instances
  - State setters (`useState`) registered with instance B while `render()` used instance A → state changes never triggered re-renders
  - Fix: Replaced 3 separate vendor files with `htm/preact/standalone.module.js` (single file, zero external imports)
- **Dashboard data**: Uptime, Version, OS, Arch now display real data from `/api/v1/info` (was showing "—" placeholders)
- **Skills Market**: Now loads 10 skills from API instead of showing "Total Skills: 0"
- **Settings page**: No longer stuck on "Loading..." forever (8s safety timeout + proper error handling)
- **Light/Dark theme**: Theme toggle works reliably (state updates propagate correctly with single Preact instance)

### Changed
- Version bump: 0.3.0 → 0.3.1
- Vendor bundle: 3 files (preact.mjs + hooks.mjs + htm.mjs) → 1 file (standalone.mjs, 13KB)
- DashboardPage: fetches `/api/v1/info` on mount for system info (uptime_secs, version, platform)
- `dashboard.rs`: embedded `standalone.mjs` in static file registry

### Technical Details
- All 20+ dashboard pages now navigate correctly via sidebar clicks
- WebSocket: 🟢 Connected status maintained across page transitions
- Language toggle (VI/EN) and theme toggle (Light/Dark) work on all pages

## [0.3.0] — 2026-03-05

### Added
- **Workflow Rules Engine**: 6 trigger types → 4 action types, visual builder in dashboard
- **Vector RAG**: Hybrid search (FTS5 keyword + Vector cosine similarity) for knowledge base
- **Scheduler++**: Cron, interval, one-time tasks with Telegram/Email/Webhook notifications
- **Android APK Build Script**: `android/build-apk.sh` (debug/release/clean)
- **InjectionScanner Integration**: Prompt injection detection active in agent pipeline
- **ShellTool Security**: Metacharacter blocking, dangerous pattern detection, env_clear, timeout
- **FileTool Security**: Path validation, traversal detection, write-protected sensitive files
- **ExecuteCodeTool Security**: Dangerous code pattern scanner (16 patterns)
- **AES-256-CBC**: Replaced ECB with CBC encryption for secrets (random IV per encryption)

### Changed
- Version bump: 0.2.0 → 0.3.0
- Test count: 144 → 342 tests passing
- Security headers: Runtime sandbox, HMAC-SHA256 key derivation
- Gateway: all std::sync::Mutex .lock().unwrap() → .unwrap_or_else() for poison recovery
- Agent: SecurityPolicy now checks both shell AND file tools (was shell-only)
- README updated with Workflow Rules, Scheduler, Vector RAG features

### Fixed
- **CRITICAL**: Tenant config loading — pass `--config` CLI flag + `BIZCLAW_CONFIG` env fallback
- **CRITICAL**: Docker networking — tenants bind `0.0.0.0` for port forwarding
- **CRITICAL**: CORS allow-all in production → restricted to 5 whitelisted domains
- **CRITICAL**: JWT secret now persistent via env var (was random per restart)
- SchedulerDb open() error handling

### Security
- AES-256-ECB → AES-256-CBC (random IV, HMAC-SHA256 key derivation)
- ShellTool: defense-in-depth (tool-level + agent-level validation)
- FileTool: forbidden paths, path traversal detection, write protection
- ExecuteCodeTool: dangerous pattern scanner
- InjectionScanner: guardrail injection into LLM context on suspicious prompts
- Mutex poisoning: 27 instances fixed across gateway
- CORS: production-only domain whitelist
- JWT: persistent random secret

## [0.2.0] — 2026-03-01

### Added
- Initial release with 19 crates
- 16 LLM providers, 9 channels, 13 tools
- Brain Engine (GGUF inference + SIMD)
- Knowledge RAG (FTS5)
- Multi-tenant admin platform
- Web Dashboard (20+ pages)
- Android FFI layer
