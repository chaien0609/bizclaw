# 📖 Module 10: Multi-Agent Orchestration (Phần 2) — Hands-on

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 10/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `parallel-agents`, `dispatching-parallel-agents`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Tạo và quản lý multiple agents trên BizClaw Dashboard
- [ ] Cấu hình Group Chat
- [ ] Handle agent failures và fallbacks
- [ ] Monitor multi-agent performance

---

## 📋 Nội Dung

### 1. Hands-on: Tạo Agent Team

#### 1.1 Tạo Agent Qua Dashboard

```
Dashboard → AI Agent → Create Agent

Agent 1:
  Name: sales-agent
  Provider: openai
  Model: gpt-4o-mini
  System Prompt: "Bạn là chuyên viên bán hàng..."

Agent 2:
  Name: support-agent
  Provider: ollama  
  Model: qwen3
  System Prompt: "Bạn là nhân viên CSKH..."

Agent 3:
  Name: analyst-agent
  Provider: deepseek
  Model: deepseek-chat
  System Prompt: "Bạn là chuyên viên phân tích dữ liệu..."
```

#### 1.2 Tạo Agent Qua API

```bash
# Create agent
curl -X POST http://localhost:3579/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sales-agent",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "system_prompt": "Bạn là chuyên viên bán hàng chuyên nghiệp..."
  }'

# Chat with specific agent
curl -X POST http://localhost:3579/api/v1/agents/sales-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Khách hỏi về chương trình khuyến mãi tháng 3"}'

# Broadcast to ALL agents
curl -X POST http://localhost:3579/api/v1/agents/broadcast \
  -H "Content-Type: application/json" \
  -d '{"message": "Chuẩn bị báo cáo quý 1/2026"}'
```

### 2. Group Chat Implementation

#### 2.1 Tạo Group Chat

```
Gửi 1 câu hỏi → TẤT CẢ agents trong group trả lời

Scenario: "Đánh giá sản phẩm mới X"
  
sales-agent:     "Thị trường target size: 500K users..."
support-agent:   "Dự kiến 15% tickets liên quan feature mới..."  
analyst-agent:   "Dựa trên data 6 tháng, conversion predict: 3.2%..."
```

#### 2.2 Group Summarizer Tool

```
13 agents trả lời cùng lúc → quá nhiều info

group_summarizer tool:
1. Buffer all responses
2. Summarize into key points
3. Highlight agreements/disagreements
4. Present structured summary to user
```

### 3. Failure Handling

#### 3.1 Individual Agent Failure

```
Scenario: DeepSeek API down

Orchestrator:
  ├── sales-agent (OpenAI)  → ✅ Success
  ├── support-agent (Ollama) → ✅ Success  
  └── analyst-agent (DeepSeek) → ❌ API Error

Strategy:
  Option A: Skip failed agent, return partial results
  Option B: Retry with fallback provider (Groq)
  Option C: Queue for later execution
  
BizClaw approach: Log error + return partial results
  → "3/3 agents responded. Analyst unavailable (DeepSeek API error)."
```

#### 3.2 Cascade Failure Prevention

```
Rule: 1 agent failure ≠ system failure

Implementation:
  - Independent execution (no shared state between agents)
  - Timeout per agent (30s default)
  - Error isolation (catch_unwind per agent)
  - Graceful degradation (partial results OK)
```

### 4. Performance Monitoring

#### 4.1 Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Response latency (single) | < 5s | > 10s |
| Response latency (group) | < 15s | > 30s |
| Success rate | > 95% | < 90% |
| Token cost / request | < $0.05 | > $0.10 |
| Quality Gate pass rate | > 90% | < 80% |

#### 4.2 LLM Tracing (BizClaw Dashboard)

```
Dashboard → LLM Traces

Trace #1234:
  Agent: sales-agent
  Provider: openai/gpt-4o-mini
  Input tokens: 450
  Output tokens: 230
  Latency: 1.8s
  Cost: $0.0012
  Quality: PASS
  Tools used: [web_search, memory_search]
```

### 5. Best Practices Checklist

- [ ] Mỗi agent có vai trò RÕ RÀNG
- [ ] Provider phù hợp với complexity của task
- [ ] Timeout được set cho mọi agent
- [ ] Failure handling cho từng agent
- [ ] Cost tracking enabled
- [ ] Quality Gate cho critical agents
- [ ] Error logs accessible
- [ ] Broadcasting tested với real data

---

## 📝 Bài Tập

### Lab: Build Agent Team (45 phút)

1. Tạo 3 agents trên BizClaw Dashboard
2. Gửi broadcast message
3. Quan sát responses, latency, cost
4. Simulate 1 agent failure, verify graceful degradation
5. Viết report: which agent adds most value?

---

## ⏭️ Buổi Tiếp Theo

**Module 11: LLM Integration & Provider Management**
