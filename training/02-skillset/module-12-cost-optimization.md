# 📖 Module 12: Cost Optimization & Prompt Caching

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 12/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `prompt-caching`, `context-window-management`, `llm-app-patterns`

---

## 🎯 Mục Tiêu Học Tập

- [ ] Tính toán chi phí LLM cho production workload
- [ ] Áp dụng Prompt Caching tiết kiệm 60-90% tokens
- [ ] Tối ưu token usage mà không giảm chất lượng
- [ ] Thiết kế cost-aware agent system

---

## 📋 Nội Dung

### 1. Chi Phí LLM — Hiểu Để Kiểm Soát

```
Cost = (Input Tokens × Input Price) + (Output Tokens × Output Price)

Ví dụ 1 request:
  System prompt: 2,000 tokens
  User message: 100 tokens
  Agent response: 500 tokens
  
  GPT-4o: (2100 × $2.50/M) + (500 × $10/M) = $0.0103
  Claude:  (2100 × $3.00/M) + (500 × $15/M) = $0.0138
  DeepSeek:(2100 × $0.14/M) + (500 × $0.28/M) = $0.0004
  Ollama:  $0 (local)

1000 requests/ngày:
  GPT-4o:   $10.30/ngày  = $309/tháng
  Claude:   $13.80/ngày  = $414/tháng
  DeepSeek: $0.40/ngày   = $12/tháng ← 25x cheaper!
  Ollama:   $0            = $0 + hardware
```

### 2. Prompt Caching — BizClaw Implementation

#### 2.1 Anthropic cache_control

```
System prompt (2000 tokens) → CACHED
User message (100 tokens)   → NOT cached

First request:  2000 + 100 = 2100 input tokens (full price)
Next requests:  0 + 100 = 100 input tokens (cached system prompt)

Savings: 95% on input tokens = ~60-90% total savings
```

#### 2.2 BizClaw Prompt Caching

```
BizClaw auto-applies cache_control for:
├── System prompt (SOUL.md + IDENTITY.md + MEMORY.md)
├── Tool schemas (13 tools)
├── Brain workspace
└── Static context (unchanged between turns)

Only dynamic content (user message, tool results) 
costs full input price.
```

### 3. Token Optimization Strategies

| Strategy | Savings | Effort | Risk |
|----------|---------|--------|------|
| **Provider selection** | 80-95% | Low | Quality tradeoff |
| **Prompt caching** | 60-90% | Zero | No risk |
| **Context compression** | 30-50% | Medium | Information loss |
| **Response length limits** | 20-40% | Low | Truncation |
| **Tool result truncation** | 10-20% | Low | Missing details |
| **Batch processing** | 15-25% | Medium | Latency increase |

### 4. Per-Agent Provider Optimization

```
BizClaw UNIQUE Feature: Mỗi agent chọn provider riêng

BEFORE (1 provider cho tất cả):
  All agents → GPT-4o → $0.01/request × 5 agents = $0.05

AFTER (mixed providers):
  Dịch thuật → Ollama/qwen3     → $0.00
  Dev coding → Claude            → $0.015
  Social     → Gemini Flash      → $0.001
  Kế toán    → DeepSeek          → $0.0004
  Helpdesk   → Groq/llama-3.3   → $0.001
  
  Total: $0.017 vs $0.05 → Tiết kiệm 66%
```

### 5. Monitoring & Alerts

```
Dashboard → LLM Traces → Cost Tracking

Daily Report:
  ┌──────────────────────────────────────┐
  │ Agent          │ Requests │ Cost     │
  ├────────────────┼──────────┼──────────┤
  │ sales-agent    │ 450      │ $2.30    │
  │ support-agent  │ 320      │ $0.00    │ ← Ollama
  │ analyst-agent  │ 85       │ $0.12    │
  │ TOTAL          │ 855      │ $2.42    │
  └──────────────────────────────────────┘
  
  Budget alert: > $10/day → notification
```

---

## 📝 Bài Tập

### Bài 1: Cost Calculator (20 phút)

Tính chi phí tháng cho scenario:
- 5 agents, 500 requests/ngày mỗi agent
- Agent A: GPT-4o, Agent B-E: DeepSeek
- System prompt: 3000 tokens, avg response: 400 tokens
- Apply prompt caching

### Bài 2: Optimization Plan (30 phút)

Hiện tại chi phí: $500/tháng (all GPT-4o). Target: < $100/tháng.
Thiết kế migration plan với mixed providers + caching.

---

## ⏭️ Buổi Tiếp Theo

**Module 13: Cài Đặt & Cấu Hình BizClaw** (Bắt đầu Phase TOOLSET)
