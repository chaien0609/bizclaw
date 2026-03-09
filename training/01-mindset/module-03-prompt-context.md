# 📖 Module 03: Tư Duy Prompt & Context Engineering

> **Phase**: 🧠 MINDSET  
> **Buổi**: 3/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `prompt-engineer`, `prompt-engineering`, `context-engineering`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Hiểu prompt là "code" — cần rigor như viết phần mềm
- [ ] Nắm vững cấu trúc System Prompt hiệu quả
- [ ] Hiểu Context Engineering: tối ưu token, attention, retrieval
- [ ] Thiết kế được system prompt cho agent nghiệp vụ

---

## 📋 Nội Dung

### 1. Prompt Là Code — Tư Duy Đúng Đắn

> *"Prompts are programming — they need the same rigor as code."*

**Sai lầm phổ biến:** Viết prompt như viết email → kết quả không nhất quán.

**Tư duy đúng:** Prompt = Specification cho LLM → cần:
- Cấu trúc rõ ràng
- Test cases
- Iteration
- Version control

#### 1.1 Instruction Hierarchy (Thứ tự ưu tiên)

```
[System Context] → [Task Instruction] → [Examples] → [Input Data] → [Output Format]
```

**Trong BizClaw:**
```
SOUL.md          → System prompt (personality, rules)
IDENTITY.md      → Agent identity, workspace
USER.md          → Human context
MEMORY.md        → Long-term context
Tool descriptions → Available capabilities
User message     → Current task
```

### 2. System Prompt Architecture

#### 2.1 Cấu trúc 6 phần

```markdown
# 1. ROLE — Agent là ai
Bạn là trợ lý bán hàng chuyên nghiệp cho cửa hàng XYZ.

# 2. CONTEXT — Bối cảnh
Cửa hàng bán đồ điện tử. Giờ mở cửa 8h-22h.
Chính sách đổi trả: 30 ngày, giữ hoá đơn.

# 3. INSTRUCTIONS — Nhiệm vụ
- Trả lời câu hỏi về sản phẩm
- Hỗ trợ đặt hàng
- Xử lý khiếu nại
- Chuyển agent khác nếu ngoài chuyên môn

# 4. CONSTRAINTS — Giới hạn
- KHÔNG bao giờ bịa giá sản phẩm
- KHÔNG hứa giao hàng < 2 giờ
- Luôn xác nhận lại thông tin quan trọng

# 5. OUTPUT FORMAT — Định dạng
- Trả lời bằng tiếng Việt
- Tối đa 200 từ/câu trả lời
- Dùng emoji phù hợp

# 6. EXAMPLES — Ví dụ
User: "iPhone 15 còn hàng không?"
Agent: "📱 Dạ, iPhone 15 hiện còn hàng ạ! 
       Giá: 22.990.000₫. Free ship nội thành.
       Anh/chị muốn đặt hàng luôn không ạ?"
```

#### 2.2 BizClaw Brain Workspace — System Prompt tự động

BizClaw tự động tạo system prompt từ `~/.bizclaw/`:

```
~/.bizclaw/
├── SOUL.md         ← Personality + behavioral rules
├── IDENTITY.md     ← Agent name, style
├── USER.md         ← Who is the human
├── MEMORY.md       ← Long-term curated context
├── TOOLS.md        ← Environment notes
└── memory/
    └── 2026-02-28.md ← Daily auto-compaction
```

**All files được load vào system prompt mỗi turn.**

### 3. Context Engineering — Nghệ Thuật Quản Lý Token

#### 3.1 Core Principles

```
🎯 Context quality > Context quantity
   → High-signal tokens > Exhaustive content

🎯 Attention is finite
   → LLM attention U-shaped: mạnh ở đầu/cuối, yếu ở giữa
   → Đặt info quan trọng ở ĐẦU hoặc CUỐI prompt

🎯 Progressive disclosure
   → Load info just-in-time, không dump tất cả

🎯 Isolation prevents degradation
   → Chia work qua sub-agents, không nhồi 1 context
```

#### 3.2 Four-Bucket Strategy

```
┌─────────────────────────────────────────────────────┐
│              Context Management                      │
│                                                      │
│  1. 💾 WRITE   → Lưu context ra ngoài               │
│     (scratchpads, files, daily logs)                 │
│                                                      │
│  2. 🔍 SELECT  → Chỉ kéo context cần thiết          │
│     (retrieval, filtering, FTS5 search)              │
│                                                      │
│  3. 📦 COMPRESS → Nén token, giữ thông tin           │
│     (summarization, auto-compaction at 70%)          │
│                                                      │
│  4. 🏗️ ISOLATE → Chia qua sub-agents                │
│     (multi-agent, mỗi agent context riêng)           │
└─────────────────────────────────────────────────────┘
```

**BizClaw áp dụng:**
- **WRITE**: MEMORY.md + daily logs
- **SELECT**: FTS5 search across conversations
- **COMPRESS**: Auto-compaction at 70% context utilization
- **ISOLATE**: Multi-Agent Orchestrator

#### 3.3 Token Budget Management

```
┌───────────────────────────────────┐
│  Context Window = 128K tokens     │
│                                   │
│  ┌─────────────────────────────┐  │
│  │ System Prompt   │ ~2K       │  │
│  │ Brain Workspace │ ~3K       │  │
│  │ Tool Schemas    │ ~1K       │  │
│  │ Conversation    │ ~variable │  │
│  │ RAG Context     │ ~2-5K     │  │
│  └─────────────────────────────┘  │
│                                   │
│  ⚠️ 70% → WARNING → Compact      │
│  🚨 90% → CRITICAL → Cut old     │
│  💀 100% → OVERFLOW → Fail       │
└───────────────────────────────────┘
```

### 4. Advanced Prompt Patterns

#### 4.1 Few-Shot Learning

```markdown
# Teach by examples, not rules

Extract order info:

Input: "Tôi muốn mua 3 cái iPhone 15, giao về Quận 7"
Output: {"product": "iPhone 15", "qty": 3, "address": "Quận 7", "priority": "normal"}

Input: "Gấp! Cần 1 MacBook Pro giao ngay hôm nay"  
Output: {"product": "MacBook Pro", "qty": 1, "address": null, "priority": "urgent"}

Now process: "Đặt 2 AirPods Pro giao về 123 Lý Tự Trọng"
```

#### 4.2 Chain-of-Thought (CoT)

```markdown
# Yêu cầu suy luận từng bước

Phân tích đơn hàng này và đề xuất hành động:

Bước 1: Kiểm tra sản phẩm có trong kho không
Bước 2: Tính giá với khuyến mãi hiện hành
Bước 3: Kiểm tra khả năng giao hàng  
Bước 4: Đề xuất upsell nếu phù hợp
Bước 5: Tạo tóm tắt cho khách

Đơn hàng: "3 cái Samsung Galaxy S24, giao trong ngày"
```

#### 4.3 Progressive Disclosure

```
Level 1: "Tóm tắt email này"
  → Không nhất quán

Level 2: "Tóm tắt email này thành 3 bullet points"
  → Tốt hơn, nhưng thiếu focus  

Level 3: "Đọc email, xác định 3 action items chính, tóm tắt mỗi item"
  → Nhất quán, chất lượng cao

Level 4: + 2-3 examples
  → Production-grade quality
```

### 5. Anti-Patterns Cần Tránh

| Anti-Pattern | Vấn đề | Fix |
|-------------|--------|-----|
| ❌ Vague Instructions | LLM tự suy diễn, kết quả khác nhau | Be explicit |
| ❌ Kitchen Sink Prompt | Nhồi quá nhiều → attention diluted | Curate context |
| ❌ No Negative Instructions | Agent làm điều không mong muốn | Include "don'ts" |
| ❌ No Examples | LLM không biết format mong muốn | Add 2-5 examples |
| ❌ Middle Context | Info quan trọng bị "lost in middle" | Đầu hoặc cuối |
| ❌ No Evaluation | Không biết prompt nào tốt hơn | A/B test |

---

## 💡 Câu Hỏi Suy Ngẫm

1. Tại sao BizClaw tách SOUL.md và MEMORY.md thay vì gộp 1 file?
2. Auto-compaction tại 70% — tại sao không phải 50% hay 90%?
3. Prompt tiếng Việt có khác gì prompt tiếng Anh? (Gợi ý: tokenization)
4. Khi nào Few-Shot tốt hơn Chain-of-Thought?

---

## 📝 Bài Tập

### Bài 1: Viết System Prompt cho Agent Kế Toán (30 phút)

Tạo system prompt đầy đủ 6 phần cho agent:
- **Vai trò**: Kế toán trưởng doanh nghiệp SME
- **Nghiệp vụ**: Kiểm tra hoá đơn, tính thuế, báo cáo tài chính
- Phải có ≥ 3 ví dụ (few-shot)
- Phải có ≥ 3 constraints (những gì KHÔNG được làm)

### Bài 2: Tối ưu Context (20 phút)

Cho prompt 5000 tokens, nén xuống < 2000 tokens mà giữ nguyên ý nghĩa:
- Áp dụng Four-Bucket Strategy
- Đánh giá: info nào WRITE, SELECT, COMPRESS, ISOLATE?

---

## ⏭️ Buổi Tiếp Theo

**Module 04: Problem Solving & Tư Duy Hệ Thống**
- Sequential thinking cho vấn đề phức tạp
- Brainstorming with trade-off analysis
- Decision-making framework cho AI Agent
