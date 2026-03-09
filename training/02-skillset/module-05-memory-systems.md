# 📖 Module 05: Memory Systems — Bộ Nhớ Cho AI Agent

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 5/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `agent-memory-systems`, `conversation-memory`, `context-window-management`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Hiểu 3-Tier Memory Architecture của BizClaw
- [ ] Phân biệt các loại memory: episodic, semantic, procedural
- [ ] Nắm vững chiến lược retrieval và auto-compaction
- [ ] Thiết kế memory strategy cho agent nghiệp vụ

---

## 📋 Nội Dung

### 1. Tại Sao Memory Quan Trọng?

> *"Memory failures look like intelligence failures."*
> — Khi agent "quên" hoặc trả lời mâu thuẫn, 90% là lỗi retrieval, không phải lỗi LLM.

**Không có Memory:**
```
User: "Tên tôi là Hoài"
Agent: "Chào Hoài!"
User: "Tôi sinh năm bao nhiêu?"
Agent: "Tôi không biết bạn là ai." ← FAIL
```

**Có Memory (BizClaw):**
```
User: "Tên tôi là Hoài"
Agent: "Chào Hoài! Tôi đã ghi nhớ."  → MEMORY.md: "User: Hoài"
User: "Tôi sinh năm 1993"
Agent: "Đã ghi nhớ. Hoài sinh 1993." → MEMORY.md updated
[2 tuần sau]
User: "Tôi bao nhiêu tuổi?"
Agent: "Hoài 33 tuổi (sinh 1993)."   → Retrieved from MEMORY.md
```

### 2. BizClaw 3-Tier Memory Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    3-Tier Memory                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ TIER 1: Brain Workspace (Always loaded)            │  │
│  │                                                     │  │
│  │  SOUL.md     → Personality, rules ("Never lie")    │  │
│  │  IDENTITY.md → Agent name, style, workspace path   │  │
│  │  USER.md     → Human identity & preferences        │  │
│  │  MEMORY.md   → Curated long-term context           │  │
│  │  TOOLS.md    → Environment-specific notes           │  │
│  │                                                     │  │
│  │  📌 Loaded into system prompt EVERY turn            │  │
│  │  📌 Never auto-compacted                            │  │
│  │  📌 User manually curates                           │  │
│  └────────────────────────────────────────────────────┘  │
│                          ▲                               │
│                          │ Auto-compact at 70%           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ TIER 2: Daily Compaction Logs                       │  │
│  │                                                     │  │
│  │  memory/2026-02-28.md → Today's summarized context │  │
│  │  memory/2026-02-27.md → Yesterday's context         │  │
│  │  memory/2026-02-26.md → ...                         │  │
│  │                                                     │  │
│  │  📌 Auto-generated when context hits 70%            │  │
│  │  📌 Summarized by LLM → persisted to file           │  │
│  │  📌 Referenced when relevant                        │  │
│  └────────────────────────────────────────────────────┘  │
│                          ▲                               │
│                          │ Full-text search              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ TIER 3: FTS5 Conversation Search                    │  │
│  │                                                     │  │
│  │  SQLite + FTS5 (Full-Text Search engine)            │  │
│  │  ├── session_id based partitioning                  │  │
│  │  ├── Keyword search across ALL conversations        │  │
│  │  ├── BM25 ranking algorithm                         │  │
│  │  └── Auto-migration on schema changes               │  │
│  │                                                     │  │
│  │  📌 Search tool: memory_search.rs                   │  │
│  │  📌 Agent can self-search "What did I say about X?" │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3. Memory Types — Phân Loại Bộ Nhớ

| Type | Mô tả | BizClaw Implementation |
|------|--------|----------------------|
| **Episodic** | Sự kiện cụ thể ("Hôm qua khách phàn nàn về giao hàng") | Daily logs + FTS5 |
| **Semantic** | Kiến thức chung ("Chính sách đổi trả 30 ngày") | MEMORY.md + Knowledge RAG |
| **Procedural** | Cách làm ("Để xử lý hoá đơn, bước 1...") | SOUL.md rules |
| **Working** | Context hiện tại (conversation buffer) | Agent runtime context |

### 4. Retrieval — Tìm Đúng Memory Đúng Lúc

> *"Lưu 1 triệu facts vô nghĩa nếu không tìm được đúng fact khi cần."*

#### 4.1 Keyword Search (FTS5)
```sql
-- BizClaw sử dụng SQLite FTS5
SELECT * FROM conversations 
WHERE conversations MATCH 'khiếu nại giao hàng'
ORDER BY rank;
-- → BM25 ranking, fast, exact keyword match
```

#### 4.2 Auto-Compaction Strategy

```
Context Window: 128K tokens
├── Used: 89K (70%) ← TRIGGER!
│
│  Auto-Compaction:
│  1. Summarize conversation so far
│  2. Save summary to memory/2026-02-28.md
│  3. Clear old messages from context
│  4. Keep: system prompt + summary + recent messages
│  5. Continue conversation seamlessly
│
├── After compaction: 35K used (27%)
└── Agent continues without losing context
```

### 5. Anti-Patterns & Best Practices

#### ❌ Store Everything Forever
```
Problem: Context overflow, irrelevant info dilutes useful info
Fix: Retention policy (90 days default), relevance scoring
```

#### ❌ Single Memory Type for All Data
```
Problem: Business rules stored same way as chat logs → retrieval noise
Fix: Separate Tier 1 (curated) from Tier 3 (searchable)
```

#### ❌ Chunk Without Testing Retrieval
```
Problem: Stored perfectly, retrieved garbage
Fix: Test retrieval before deploying — search "chính sách đổi trả" 
     → should return policy document, not chat about returns
```

#### ✅ Best Practices

1. **MEMORY.md chỉ chứa curated knowledge** — do human review
2. **Daily logs tự động** — agent không cần manual save
3. **FTS5 search là safety net** — khi Tier 1-2 không đủ
4. **Metadata matters** — `session_id`, timestamp, topic tags
5. **Test retrieval regularly** — search quality degrades over time

---

## 📝 Bài Tập

### Bài 1: Thiết Kế Memory Strategy (30 phút)

Cho agent "HR Recruiter" xử lý 50 CV/ngày:

| Tier | Lưu gì? | Retention | Search Pattern |
|------|---------|-----------|---------------|
| 1 | ? | ? | ? |
| 2 | ? | ? | ? |
| 3 | ? | ? | ? |

### Bài 2: Viết SOUL.md + MEMORY.md (20 phút)

Tạo Brain Workspace cho agent Sales:
- SOUL.md: Personality + 5 rules
- MEMORY.md: 10 key facts về business

---

## ⏭️ Buổi Tiếp Theo

**Module 06: RAG — Retrieval-Augmented Generation**
