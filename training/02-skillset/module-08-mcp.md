# 📖 Module 08: MCP — Model Context Protocol

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 8/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `mcp-builder`, `mcp-management`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Hiểu MCP là gì và tại sao nó là "lingua franca" cho AI tools
- [ ] Nắm vững MCP client trong BizClaw (`bizclaw-mcp`)
- [ ] Kết nối MCP servers bên ngoài vào BizClaw
- [ ] Thiết kế MCP server đơn giản

---

## 📋 Nội Dung

### 1. MCP — Chuẩn Giao Tiếp Cho AI Tools

> *"MCP = USB cho AI. Cắm bất kỳ MCP server nào → agent có thêm tools."*

```
┌──────────────┐     JSON-RPC 2.0     ┌──────────────┐
│  BizClaw     │ ◀────── stdio ──────▶│  MCP Server  │
│  (MCP Client)│                      │  (Any tool)  │
└──────────────┘                      └──────────────┘
     Agent                              External Service
     
Ví dụ:
  Agent ──MCP──▶ PageIndex Server ──▶ 98.7% accurate RAG
  Agent ──MCP──▶ GitHub Server    ──▶ Create issues, PRs
  Agent ──MCP──▶ Database Server  ──▶ Query PostgreSQL
```

### 2. Cấu Hình MCP Trong BizClaw

```toml
# config.toml

[[mcp_servers]]
name = "pageindex"
command = "npx"
args = ["-y", "@pageindex/mcp"]
# 📑 Reasoning-based RAG — 98.7% accuracy

[[mcp_servers]]
name = "github"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "ghp_..." }

[[mcp_servers]]
name = "database"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-postgres"]
env = { DATABASE_URL = "postgresql://..." }
```

### 3. MCP Architecture

```
┌─────────────────────────────────────────┐
│  BizClaw Agent                          │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  bizclaw-mcp (Client)            │   │
│  │  ├── JSON-RPC 2.0 via stdio      │   │
│  │  ├── Tool discovery (list_tools)  │   │
│  │  ├── Tool execution (call_tool)   │   │
│  │  └── Resource access              │   │
│  └──────────────┬───────────────────┘   │
│                  │                       │
│    ┌─────────────┼────────────────┐      │
│    ▼             ▼                ▼      │
│  ┌────┐    ┌─────────┐    ┌──────────┐  │
│  │ MCP│    │  MCP    │    │   MCP    │  │
│  │ #1 │    │  #2     │    │   #3     │  │
│  └────┘    └─────────┘    └──────────┘  │
│  github    pageindex      database      │
└─────────────────────────────────────────┘
```

### 4. Agent-Centric Design Principles

Khi thiết kế MCP server, luôn nhớ:

1. **Build for Workflows, Not API Endpoints**
   - ❌ `check_availability` + `create_event` (2 tools)  
   - ✅ `schedule_event` (1 tool: check + create + notify)

2. **Optimize for Limited Context**
   - Default to concise responses
   - Return names over IDs
   - Provide `format: "concise" | "detailed"` option

3. **Actionable Error Messages**
   - ❌ `"Error 404"`  
   - ✅ `"File not found. Available files: sales.csv, orders.csv. Try: read('sales.csv')"`

4. **Tool Annotations**
   ```json
   {
     "readOnlyHint": true,
     "destructiveHint": false,
     "idempotentHint": true,
     "openWorldHint": true
   }
   ```

### 5. Xây Dựng MCP Server Đơn Giản (Python)

```python
# inventory_mcp.py — MCP Server cho quản lý kho
from mcp import FastMCP

mcp = FastMCP("inventory")

@mcp.tool
def check_stock(product_name: str) -> str:
    """Check stock level for a product.
    
    Args:
        product_name: Product name to check. Example: "iPhone 15"
    
    Returns:
        Stock info with quantity and warehouse location.
        If product not found, suggests similar products.
    """
    stock = db.query(f"SELECT * FROM inventory WHERE name LIKE '%{product_name}%'")
    if not stock:
        similar = db.query("SELECT name FROM inventory ORDER BY name LIMIT 5")
        return f"Product '{product_name}' not found. Available: {similar}"
    return f"{stock[0].name}: {stock[0].quantity} units at {stock[0].warehouse}"

@mcp.tool
def update_stock(product_id: int, quantity_change: int, reason: str) -> str:
    """Update stock quantity. Positive = add, negative = remove.
    
    Args:
        product_id: Product ID (get from check_stock first)
        quantity_change: Amount to add (positive) or remove (negative)
        reason: Reason for change. Example: "Customer return" or "New shipment"
    """
    # Implementation...
    return f"Stock updated. New quantity: {new_qty}"

if __name__ == "__main__":
    mcp.run()
```

**Kết nối vào BizClaw:**
```toml
[[mcp_servers]]
name = "inventory"
command = "python"
args = ["inventory_mcp.py"]
```

---

## 📝 Bài Tập

### Bài 1: Kết nối MCP Servers (30 phút)

Cấu hình 3 MCP servers trong BizClaw config.toml:
1. PageIndex (RAG)
2. GitHub (code management)
3. 1 custom server (chọn từ NPM registry)

### Bài 2: Thiết Kế MCP Server (20 phút)

Thiết kế MCP server cho "Restaurant Booking":
- List ≥ 3 tools với schema đầy đủ
- Follow agent-centric design principles
- Include error handling

---

## ⏭️ Buổi Tiếp Theo

**Module 09: Multi-Agent Orchestration (Phần 1)**
