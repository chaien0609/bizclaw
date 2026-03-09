# 📖 Module 07: Tool Design & Function Calling

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 7/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `agent-tool-builder`, `ai-agents-architect`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Hiểu LLM chỉ thấy schema + description, không thấy code
- [ ] Thiết kế tool schema JSON hiệu quả
- [ ] Nắm vững error handling cho tools
- [ ] Map 13 built-in tools của BizClaw vào use cases

---

## 📋 Nội Dung

### 1. Core Insight: Description > Implementation

> *"The LLM never sees your code. It only sees the schema and description.  
> A perfectly implemented tool with a vague description will FAIL.  
> A simple tool with crystal-clear documentation will SUCCEED."*

```
❌ BAD tool description:
   name: "do_stuff"
   description: "Does things with data"
   → LLM confused, wrong tool selection

✅ GOOD tool description:
   name: "search_products"  
   description: "Search product catalog by name, category, or price range.
                  Returns max 10 results sorted by relevance.
                  Example: search_products(query='iPhone', max_price=25000000)"
   → LLM confident, correct tool selection
```

### 2. Tool Schema Design

#### 2.1 JSON Schema Format

```json
{
  "name": "shell_execute",
  "description": "Execute a shell command on the server. Use for: listing files, checking processes, disk space, network status. Do NOT use for: dangerous commands (rm -rf, shutdown). Returns stdout, stderr, and exit code.",
  "parameters": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "Shell command to execute. Example: 'ls -la /data' or 'df -h'"
      },
      "timeout": {
        "type": "integer",
        "description": "Max execution time in seconds. Default: 30. Max: 120.",
        "default": 30,
        "maximum": 120
      }
    },
    "required": ["command"]
  }
}
```

#### 2.2 BizClaw 13 Built-in Tools

| Tool | Mô tả | Use Case |
|------|--------|----------|
| `shell` | Execute shell commands (sandboxed) | System admin, file ops |
| `file` | Read/write/append files, ls-style | Document management |
| `edit_file` | Precise text replacements with dry_run | Code editing |
| `glob_find` | Find files matching patterns | File discovery |
| `grep_search` | Regex/literal content search | Code search |
| `web_search` | DuckDuckGo (no API key) | Research |
| `http_request` | HTTP API client with safety blocks | API integration |
| `config_manager` | Runtime config.toml read/write | Settings |
| `memory_search` | FTS5 conversation search | Memory recall |
| `execute_code` | Run code in 9 languages | Computation |
| `plan_tool` | Structured task decomposition | Planning |
| `session_context` | Agent self-awareness | Meta-cognition |
| `group_summarizer` | Buffer + summarize group messages | Group chat |

### 3. Tool Error Handling — Errors That Help

```
❌ BAD error:
   "Error: failed"
   → LLM has no idea what to do next

✅ GOOD error:
   "Error: File not found at /data/report.csv. 
    Available files in /data/: sales.csv, orders.csv, customers.csv.
    Try: file.read('/data/sales.csv')"
   → LLM can self-correct and try alternative
```

**Principles:**
1. **Actionable**: Tell the LLM what to do next
2. **Educational**: Help the LLM learn proper usage
3. **Specific**: Include actual values, not generic messages
4. **Suggestive**: Offer alternatives when available

### 4. Tool Safety — Command Allowlist

BizClaw implements **Command Allowlist** for shell tool:

```rust
// Security: Only allowed commands can execute
const ALLOWED_COMMANDS: &[&str] = &[
    "ls", "cat", "head", "tail", "wc", "grep", "find",
    "df", "du", "date", "whoami", "pwd", "echo",
    // NOT: rm, mv, shutdown, reboot, chmod, chown
];
```

**Levels of safety:**
1. **Allowlist**: Only whitelisted commands
2. **Sandbox**: Isolated execution environment
3. **Timeout**: Max 120s, auto-kill
4. **Dry-run**: Preview changes before executing (edit_file)

### 5. Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| ❌ Vague Descriptions | LLM picks wrong tool | Write crystal-clear docs |
| ❌ Silent Failures | Agent thinks tool succeeded | Always return error details |
| ❌ Too Many Tools | LLM confused (>15) | Curate per agent role |
| ❌ No Examples | LLM doesn't know format | Include example inputs/outputs |
| ❌ No Timeout | Infinite execution | Max 120s for all tools |

---

## 📝 Bài Tập

### Bài 1: Design Custom Tool (30 phút)

Thiết kế tool `check_inventory` cho agent kho:
- JSON Schema đầy đủ
- Description rõ ràng với ≥ 2 examples
- Error handling cho 3 failure cases
- Safety constraints

### Bài 2: Tool Selection Exercise (20 phút)

Cho 10 user queries, chọn đúng tool từ 13 BizClaw tools. Giải thích lý do.

---

## ⏭️ Buổi Tiếp Theo

**Module 08: MCP — Model Context Protocol**
