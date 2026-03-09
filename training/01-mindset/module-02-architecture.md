# 📖 Module 02: Kiến Trúc Hệ Thống AI Agent

> **Phase**: 🧠 MINDSET  
> **Buổi**: 2/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `architecture`, `ai-agents-architect`, `software-architecture`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Hiểu kiến trúc trait-driven trong BizClaw
- [ ] Nắm vững Think-Act-Observe loop
- [ ] Phân biệt các architecture patterns cho AI Agent
- [ ] Hiểu cách 14 crates của BizClaw phối hợp với nhau

---

## 📋 Nội Dung

### 1. Kiến Trúc Agent — Từ Lý Thuyết Đến BizClaw

#### 1.1 Agent Architecture Fundamentals

Mọi AI Agent đều có 4 thành phần cốt lõi:

```
┌─────────────────────────────────────────────────┐
│                   AI Agent                       │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Brain    │  │  Memory  │  │   Tools      │  │
│  │ (LLM)    │  │ (State)  │  │ (Actions)    │  │
│  └─────┬────┘  └─────┬────┘  └──────┬───────┘  │
│        │             │              │            │
│        └─────────────┼──────────────┘            │
│                      ▼                           │
│              ┌──────────────┐                    │
│              │  Channels    │                    │
│              │  (I/O)       │                    │
│              └──────────────┘                    │
└─────────────────────────────────────────────────┘
```

1. **Brain (Bộ não)**: LLM inference — suy luận, ra quyết định
2. **Memory (Bộ nhớ)**: Lưu trữ và truy xuất context
3. **Tools (Công cụ)**: Hành động: đọc file, gọi API, chạy lệnh
4. **Channels (Kênh)**: Input/Output: Telegram, email, CLI, WebSocket

#### 1.2 BizClaw: Trait-Driven Architecture

**"Trait"** trong Rust = Interface trong Java/TypeScript

```rust
// Mỗi thành phần định nghĩa bởi trait
// → Dễ thay thế, mở rộng, test

trait Provider {
    fn chat(&self, messages: Vec<Message>) -> Result<Response>;
    fn name(&self) -> &str;
}

trait Channel {
    fn send(&self, message: &str) -> Result<()>;
    fn receive(&self) -> Result<Message>;
}

trait Tool {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn execute(&self, params: Value) -> Result<Value>;
}

trait MemoryBackend {
    fn store(&self, entry: MemoryEntry) -> Result<()>;
    fn search(&self, query: &str) -> Result<Vec<MemoryEntry>>;
}
```

**Lợi ích:**
- 🔌 **Plug & Play**: Thêm provider mới chỉ cần implement trait
- 🧪 **Dễ test**: Mock bất kỳ component nào
- 🔄 **Mở rộng**: 15 providers, 9 channels, 13 tools từ cùng 1 kiến trúc

### 2. Think-Act-Observe Loop

**Đây là trái tim của BizClaw Agent Runtime.**

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│   📥 Input         ┌────────────────────────┐         │
│   (User message)──▶│ 1. THINK (Suy luận)    │         │
│                     │    "Tôi cần làm gì?"   │         │
│                     └──────────┬─────────────┘         │
│                                │                       │
│                     ┌──────────▼─────────────┐         │
│                     │ 2. ACT (Hành động)     │         │
│                     │    Tool: shell.execute  │         │
│                     │    Tool: file.read      │         │
│                     └──────────┬─────────────┘         │
│                                │                       │
│                     ┌──────────▼─────────────┐         │
│                     │ 3. OBSERVE (Quan sát)  │         │
│                     │    Đánh giá kết quả    │         │
│                     └──────────┬─────────────┘         │
│                                │                       │
│                      ┌─────────▼──────────┐            │
│                      │ Hoàn thành?         │            │
│                      │ ├── Có → Response   │            │
│                      │ └── Chưa → Loop     │            │
│                      └────────────────────┘            │
│                                                       │
│   ⚠️ Max 5 rounds (prevent infinite loop)              │
│   ✅ Quality Gate: Evaluator LLM review response       │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Ví dụ thực tế trong BizClaw:**

```
User: "Tìm file nào lớn nhất trong thư mục /data"

Round 1:
  Think:  Cần dùng shell command để liệt kê files
  Act:    shell.execute("du -sh /data/* | sort -rh | head -5")
  Observe: /data/backup.sql  2.3G
            /data/logs.tar    890M
            /data/images/     456M

Round 2:
  Think:  Đã có kết quả, trả lời user
  Act:    (no more tools needed)
  Response: "File lớn nhất là backup.sql (2.3 GB)."

✅ Quality Gate → Evaluator xác nhận: Answer đầy đủ, chính xác
```

### 3. Crate Map — 14 Module Của BizClaw

```
BizClaw Workspace (Cargo.toml)
│
├── 📦 bizclaw (bin)          — CLI agent binary
├── 📦 bizclaw-platform (bin) — Multi-tenant admin
│
├── 🏗️ Core Layer
│   ├── bizclaw-core          — Traits: Channel, Tool, Provider
│   ├── bizclaw-security      — AES-256, sandbox, allowlist
│   └── bizclaw-runtime       — Process adapters
│
├── 🧠 Intelligence Layer
│   ├── bizclaw-brain         — Local GGUF inference (SIMD)
│   ├── bizclaw-providers     — 15 LLM providers
│   ├── bizclaw-agent         — Agent runtime + orchestrator
│   └── bizclaw-memory        — 3-tier memory system
│
├── 🔌 Integration Layer
│   ├── bizclaw-channels      — 9 channel types
│   ├── bizclaw-tools         — 13 native tools
│   ├── bizclaw-mcp           — MCP client (JSON-RPC 2.0)
│   └── bizclaw-knowledge     — Personal RAG (FTS5)
│
├── 🌐 Delivery Layer
│   ├── bizclaw-gateway       — HTTP/WS API + Dashboard
│   ├── bizclaw-scheduler     — Cron-style tasks
│   └── bizclaw-ffi           — Android/Edge FFI
│
└── 💾 Data Layer
    └── bizclaw-db            — SQLite/PostgreSQL
```

**Triết lý kiến trúc:**
- Mỗi crate có **trách nhiệm duy nhất** (Single Responsibility)
- Các crate giao tiếp qua **traits**, không phải implementation
- **Dependency direction**: luôn đi từ ngoài vào trong (Gateway → Agent → Core)

### 4. Architecture Patterns Cho AI Agent

#### 4.1 ReAct Pattern (BizClaw mặc định)

```
Reason → Act → Observe → Repeat
```
- ✅ Đơn giản, dễ debug
- ✅ Phù hợp hầu hết use cases
- ❌ Không hiệu quả cho tasks phức tạp nhiều bước

#### 4.2 Plan-and-Execute Pattern (BizClaw Plan Mode)

```
Plan → [Step1, Step2, ...] → Execute each → Replan if needed
```
- ✅ Hiệu quả cho tasks phức tạp
- ✅ Có roadmap rõ ràng
- ❌ Overhead cho tasks đơn giản
- BizClaw: `plan_tool.rs` — State machine Draft → Approved → InProgress → Completed

#### 4.3 Multi-Agent Pattern (BizClaw Orchestrator)

```
Coordinator → [Agent A, Agent B, Agent C] → Synthesize
```
- ✅ Chuyên biệt hoá từng agent
- ✅ Parallel execution
- ❌ Complexity overhead
- BizClaw: `orchestrator.rs` — Multi-Agent Orchestrator

### 5. Quality Gates — Chất Lượng Không Thoả Hiệp

```rust
// BizClaw Quality Gate: Evaluator LLM tự review response
fn quality_check(response: &str, question: &str) -> QualityResult {
    let eval_prompt = format!(
        "Đánh giá response này có trả lời đúng câu hỏi không?
         Câu hỏi: {}
         Response: {}
         Đánh giá: Pass/Fail + Lý do",
        question, response
    );
    
    // Agent thứ 2 (evaluator) kiểm tra agent thứ 1
    evaluator_llm.evaluate(eval_prompt)
}
```

**Tại sao cần Quality Gate?**
- LLM có thể hallucinate (bịa ra thông tin)
- Response có thể thiếu thông tin
- Auto-revision nếu chưa đạt → nâng chất lượng

---

## 🔑 Tư Duy Kiến Trúc Cốt Lõi

### "Thiết kế cho failure, không phải cho success"

```
❌ "Agent sẽ luôn trả lời đúng"
✅ "Agent SẼ sai — chuẩn bị cách handle failure"

❌ "LLM đủ thông minh để tự xử lý"  
✅ "LLM cần guardrails, constraints, và max iterations"

❌ "Thêm càng nhiều tools càng tốt"
✅ "Curate tools theo task — quá nhiều tools → giảm accuracy"
```

### Anti-Patterns Cần Tránh

| Anti-Pattern | Vấn đề | Giải pháp |
|-------------|--------|-----------|
| ❌ Unlimited Autonomy | Agent loop vô tận | Max 5 rounds |
| ❌ Tool Overload | LLM confused > 15 tools | Curate per task |
| ❌ Memory Hoarding | Context window overflow | Auto-compaction at 70% |
| ❌ No Iteration Limit | Infinite cost | Hard limits |
| ❌ Trusting Output | Hallucination | Quality Gates |

---

## 💡 Câu Hỏi Suy Ngẫm

1. Tại sao BizClaw chọn Rust thay vì Python cho AI Agent platform?
2. Nếu bạn thêm 1 provider mới (ví dụ: Grok), bạn cần implement những gì?
3. Quality Gate có nhược điểm gì? (Gợi ý: chi phí, latency)
4. Khi nào nên dùng Plan-Execute thay vì ReAct?

---

## 📝 Bài Tập

### Bài 1: Vẽ Architecture Diagram (30 phút)

Dựa trên kiến thức đã học, vẽ lại kiến trúc BizClaw theo cách hiểu của bạn:
- Ghi rõ data flow từ user input → agent processing → response
- Đánh dấu boundaries giữa các crates
- Ghi chú traits nào kết nối các components

### Bài 2: Phân tích Trade-offs (20 phút)

Với scenario: "Agent CSKH cho cửa hàng online, xử lý 100+ tin nhắn/ngày"

Phân tích:
- Nên dùng pattern nào? (ReAct / Plan-Execute / Multi-Agent)
- Cần bao nhiêu tools?
- Quality Gate có cần thiết không?
- Max rounds nên là mấy?

---

## ⏭️ Buổi Tiếp Theo

**Module 03: Tư duy Prompt & Context Engineering**
- Prompt design cho AI Agent
- Context window management
- System prompt architecture
