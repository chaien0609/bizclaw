# 📖 Session 5: Multi-Agent & Cost Optimization

> ⏰ **14:45 - 15:45** (1 giờ)  
> 🎯 **Mục tiêu**: Setup multi-agent team + tính chi phí chính xác cho khách

---

## 👥 Phần A: Multi-Agent — Khi Nào Và Cách Nào (30 phút)

### A1: Rule of Thumb Cho Trainer

```
1 agent đủ khi:
  → 1 nghiệp vụ rõ ràng (CSKH only, Content only)
  → < 100 messages/ngày
  → Budget hạn chế

Multi-agent khi:
  → Nhiều nghiệp vụ khác nhau (Sales + Support + HR)
  → Cần chuyên biệt hoá (mỗi agent 1 expertise)
  → > 100 messages/ngày → phân tải
```

### A2: Setup Multi-Agent — 3 Bước

```
Bước 1: Dashboard → Agents → Create (lặp lại cho mỗi agent)
  
  Agent "CSKH"    → DeepSeek  → $0.14/M  → CSKH only
  Agent "Sales"   → GPT-4o-mini → $0.15/M → Sales only  
  Agent "Content" → Ollama     → $0       → Content only

Bước 2: Test từng agent riêng
  → POST /api/v1/agents/cskh/chat
  → POST /api/v1/agents/sales/chat

Bước 3: Broadcast test
  → POST /api/v1/agents/broadcast
  → Tất cả agents trả lời cùng 1 câu hỏi
```

### A3: Per-Agent Provider — Selling Point Mạnh

**Bảng so sánh cho khách:**

```
❌ TRƯỚC (1 provider cho tất cả):
   5 agents × GPT-4o × 500 req/ngày × $0.01 = $25/ngày = $750/tháng

✅ SAU (BizClaw mixed providers):
   Agent CSKH    → DeepSeek     → 500 req × $0.0004 = $0.20/ngày
   Agent Sales   → GPT-4o-mini  → 200 req × $0.0015 = $0.30/ngày
   Agent Content → Ollama       → 100 req × $0      = $0/ngày
   Agent Report  → Groq         → 50 req  × $0.001  = $0.05/ngày
   Agent HR      → Gemini Flash → 100 req × $0.001  = $0.10/ngày
   ──────────────────────────────────────────────────────
   Total: $0.65/ngày = $19.50/tháng

   💰 Tiết kiệm: $750 → $20 = 97%!
```

---

## 💰 Phần B: Cost Calculator — Tính Cho Khách (20 phút)

### B1: Công Thức

```
Cost/request = (Input Tokens × Input Price) + (Output Tokens × Output Price)

Trung bình:
  System prompt: ~2000 tokens (cố định, cached)
  User message:  ~100 tokens
  Agent response: ~400 tokens

Ví dụ GPT-4o-mini:
  Input:  2100 × $0.15/M = $0.000315
  Output: 400 × $0.60/M  = $0.000240
  Total:  $0.000555/request ≈ $0.0006

1000 req/ngày × $0.0006 = $0.60/ngày = $18/tháng
```

### B2: Bảng Giá Nhanh (Trainer thuộc)

| Provider | Input $/M tokens | Output $/M tokens | ~$/1000 req |
|----------|-----------------|-------------------|-------------|
| GPT-4o | $2.50 | $10.00 | $6.50 |
| GPT-4o-mini | $0.15 | $0.60 | $0.55 |
| Claude 3.5 Sonnet | $3.00 | $15.00 | $9.30 |
| DeepSeek Chat | $0.14 | $0.28 | $0.41 |
| Gemini Flash | $0.075 | $0.30 | $0.28 |
| Groq (free tier) | $0 | $0 | $0 |
| Ollama | $0 | $0 | $0 |

### B3: ROI Slide Cho Khách

```
┌─────────────────────────────────────────────────────┐
│  💰 ROI Analysis                                     │
│                                                      │
│  Chi phí HIỆN TẠI:                                   │
│    2 nhân viên CSKH × 15tr = 30 triệu/tháng        │
│                                                      │
│  Chi phí BizClaw:                                    │
│    VPS: 200K/tháng                                   │
│    API: 500K/tháng (mixed providers)                 │
│    Total: 700K/tháng                                 │
│                                                      │
│  TIẾT KIỆM: 29.3 triệu/tháng = 97%                │
│  ROI: 4,186%                                        │
│  Payback: < 1 tuần                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Phần C: Lab (10 phút)

### Trainer tự tính:

Cho scenario: "Công ty có 3 nghiệp vụ, 800 messages/ngày tổng"
1. Phân chia: bao nhiêu agent? Provider nào cho agent nào?
2. Tính chi phí/tháng
3. So sánh vs chi phí nhân sự hiện tại
4. Viết 1 slide ROI

---

## ✅ Checkpoint Session 5

- [ ] Setup 2+ agents thành công
- [ ] Biết chọn provider theo budget
- [ ] Tính được chi phí/tháng cho khách
- [ ] Có bảng ROI sẵn sàng present
- [ ] Thuộc bảng giá 7 providers chính

---

*☕ Break 15 phút → Session 6*
