# 📖 Module 04: Problem Solving & Tư Duy Hệ Thống

> **Phase**: 🧠 MINDSET  
> **Buổi**: 4/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `sequential-thinking`, `problem-solving`, `brainstorm`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Áp dụng Sequential Thinking cho vấn đề phức tạp
- [ ] Sử dụng Decision Matrix để chọn giải pháp AI Agent
- [ ] Brainstorm với trade-off analysis trung thực
- [ ] Thiết kế agent system từ business requirement

---

## 📋 Nội Dung

### 1. Sequential Thinking — Suy Luận Có Cấu Trúc

> *Khi vấn đề quá phức tạp để giải quyết trực tiếp → chia nhỏ, giải quyết từng phần, cho phép quay lại sửa.*

#### 1.1 Framework 5 Bước

```
1. DECOMPOSE  → Chia vấn đề lớn thành sub-problems
2. HYPOTHESIZE → Đặt giả thuyết cho mỗi sub-problem  
3. VERIFY     → Kiểm chứng từng giả thuyết
4. REVISE     → Điều chỉnh nếu sai (backtracking)
5. SYNTHESIZE → Tổng hợp kết quả
```

#### 1.2 Ví Dụ: Thiết Kế Agent System Cho Nhà Hàng

**Yêu cầu:** "Xây dựng AI Agent cho chuỗi nhà hàng 5 chi nhánh"

```
DECOMPOSE:
├── Sub-1: Agent nào cần tạo?
├── Sub-2: Channels nào khách hàng dùng?
├── Sub-3: Tools nào agent cần?
├── Sub-4: Memory cần lưu gì?
└── Sub-5: Security constraints?

HYPOTHESIZE:
├── H1: Cần 3 agents: Đặt bàn, Menu, Feedback
├── H2: Channels: Zalo (80%), Fanpage (15%), Phone (5%)
├── H3: Tools: calendar, database, notification
├── H4: Memory: lịch sử đặt bàn, preferences khách VIP
└── H5: PCI compliance cho payment

VERIFY:
├── H1: ✅ Nhưng cần thêm Agent quản lý kho (cook feedback)
├── H2: ✅ Confirm với data thực, 85% dùng Zalo
├── H3: ✅ Thêm tool: pos_integration
├── H4: ✅ Cần retention policy 90 ngày
└── H5: ❌ Chưa cần PCI, chỉ đặt bàn, chưa thanh toán

REVISE: 4 agents thay vì 3, bỏ payment compliance

SYNTHESIZE: 
  4 agents × 2 channels × 5 tools = MVP scope
```

### 2. Decision Matrix — Chọn Giải Pháp Đúng

#### 2.1 Architecture Decision Matrix

| Criteria | Weight | ReAct | Plan-Execute | Multi-Agent |
|----------|--------|-------|-------------|------------|
| Complexity phù hợp | 30% | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Chi phí API | 25% | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Accuracy | 20% | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Debug dễ | 15% | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Scalability | 10% | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Score** | **100%** | **2.65** | **2.30** | **1.60** |

> **Kết luận:** Với hầu hết business use cases → **ReAct** là lựa chọn tốt nhất (BizClaw default). Multi-Agent chỉ khi thực sự cần chuyên biệt hoá.

#### 2.2 Provider Selection Matrix

```
┌────────────────────────────────────────────────────────────┐
│  Task Complexity vs Budget                                  │
│                                                             │
│  High ┤  ┌───────────────┐  ┌───────────────┐             │
│       │  │ Claude 3.5    │  │ GPT-4o        │             │
│       │  │ (Best reason) │  │ (Best general)│             │
│       │  └───────────────┘  └───────────────┘             │
│       │                                                     │
│  Med  ┤  ┌───────────────┐  ┌───────────────┐             │
│       │  │ Gemini Flash  │  │ DeepSeek Chat │             │
│       │  │ (Fast+cheap)  │  │ (Best value)  │             │
│       │  └───────────────┘  └───────────────┘             │
│       │                                                     │
│  Low  ┤  ┌───────────────┐  ┌───────────────┐             │
│       │  │ Ollama (Free) │  │ Brain Engine  │             │
│       │  │ (Local LLM)   │  │ (Offline GGUF)│             │
│       │  └───────────────┘  └───────────────┘             │
│       └──────────┬──────────────────┬──────────            │
│              Low Budget         High Budget                 │
└────────────────────────────────────────────────────────────┘
```

### 3. Brainstorming Với Trade-Off Analysis

#### 3.1 Framework: Honest Trade-offs

> *"Không có giải pháp hoàn hảo. Chỉ có trade-offs."*

**Quy tắc:**
- Mỗi giải pháp → ≥ 2 pros + ≥ 2 cons
- Không được nói "không có nhược điểm"
- Quantify khi có thể (%, $, ms)

#### 3.2 Ví Dụ: Self-Hosted vs Cloud AI

| | Self-Hosted (BizClaw) | Cloud AI (OpenAI API) |
|--|----------------------|---------------------|
| **Pros** | Data sovereignty 100% | Zero setup time |
| | $0 với Ollama/Pi | Always latest models |
| | No API rate limits | Auto-scaling |
| | Full customization | Managed infrastructure |
| **Cons** | Setup phức tạp hơn | Data privacy risk |
| | Cần maintain server | Vendor lock-in |
| | Models local yếu hơn | Chi phí tăng theo usage |
| | Cần technical team | Rate limits strict |
| **Best for** | Enterprise, sensitive data | Startups, rapid prototype |

### 4. Thiết Kế Agent System Từ Business Requirements

#### 4.1 Framework: Requirements → Agent Design

```
Step 1: WHO — Ai là end-user?
Step 2: WHAT — Họ cần giải quyết vấn đề gì?
Step 3: WHEN — Khi nào họ cần? (real-time? batch? scheduled?)
Step 4: WHERE — Qua channel nào? (Telegram? Email? Web?)
Step 5: HOW — Agent cần tools/capabilities gì?
Step 6: GUARDRAILS — Giới hạn gì? (industry, legal, business)
```

#### 4.2 Case Study: Công Ty Logistics

```
WHO:   Nhân viên kho (blue-collar, ít tech-savvy)
WHAT:  Kiểm tra tồn kho, nhập/xuất, báo cáo
WHEN:  Real-time (kiểm hàng), Daily (báo cáo)
WHERE: Zalo (primary), SMS (backup)  
HOW:   database.query, barcode.scan, report.generate
GUARDRAILS:
  - KHÔNG tự động xuất hàng > 100 triệu
  - BẮT BUỘC xác nhận manager cho batch lớn
  - Log mọi thao tác vào audit trail
```

**→ BizClaw Solution:**
```
bizclaw agent --provider ollama/qwen3
              --channel zalo
              --tools "database,file,notification"
              --max-rounds 3
              --quality-gate true
```

### 5. Tư Duy "First Principles" Cho AI Agent

> *"Đừng hỏi 'AI có thể làm gì?' — Hỏi 'Vấn đề cốt lõi là gì?'"*

```
BAD:  "AI có thể giúp gì cho HR?"
      → Quá rộng, dẫn đến giải pháp chung chung

GOOD: "HR team mất 3 giờ/ngày để sàng lọi CV thủ công.
       80% CV không đạt yêu cầu cơ bản.
       Cần giảm xuống < 30 phút."
      → Cụ thể, measurable, actionable
      → Agent CV Screening: đọc CV → match JD → score → filter
```

---

## 💡 Câu Hỏi Suy Ngẫm

1. Trong Sequential Thinking, khi nào nên "backtrack" (quay lại sửa giả thuyết)?
2. Decision Matrix có thiên kiến không? Ai quyết định weights?
3. BizClaw có 51 agent templates — liệu có quá nhiều? Khi nào "đủ"?
4. Làm sao đo lường ROI của AI Agent cho doanh nghiệp?

---

## 📝 Bài Tập

### Bài 1: Sequential Thinking — Thiết kế Agent cho Industry của bạn (45 phút)

Chọn 1 ngành bạn quen thuộc. Áp dụng framework 5 bước:
1. DECOMPOSE → chia vấn đề
2. HYPOTHESIZE → đặt giả thuyết
3. VERIFY → kiểm chứng
4. REVISE → điều chỉnh
5. SYNTHESIZE → tổng hợp

Output: 1 trang A4 mô tả agent system cho ngành đã chọn.

### Bài 2: Trade-off Analysis (15 phút)

So sánh 2 approach cho "Agent CSKH 24/7":
- **A**: 1 agent đa năng (xử lý tất cả)
- **B**: 3 agent chuyên biệt (FAQ, Orders, Complaints)

Mỗi approach: ≥ 3 pros, ≥ 3 cons, honest trade-offs.

---

## ⏭️ Buổi Tiếp Theo

**Module 05: Memory Systems — Bộ Nhớ Cho AI Agent** (Bắt đầu Phase SKILLSET)
- 3-Tier Memory Architecture
- FTS5 Search
- Auto-compaction strategy
