# 📖 Module 09: Multi-Agent Orchestration (Phần 1)

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 9/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `crewai`, `langgraph`, `parallel-agents`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Hiểu khi nào THỰC SỰ cần multi-agent (vs single agent)
- [ ] Nắm vững Orchestrator pattern trong BizClaw
- [ ] Phân biệt Sequential, Parallel, và Hierarchical orchestration
- [ ] Thiết kế agent team cho business scenario

---

## 📋 Nội Dung

### 1. Khi Nào Cần Multi-Agent?

> *"Using multiple agents when one would work = anti-pattern"*

#### ❌ KHÔNG cần multi-agent khi:
- 1 agent + đúng tools đủ giải quyết
- Tasks đơn giản, sequential
- Budget giới hạn (multi-agent = 2-10x cost)

#### ✅ CẦN multi-agent khi:
- Tasks cần **chuyên môn khác nhau** (Marketing + Finance + Legal)
- **Parallel execution** có thể (research + analysis cùng lúc)
- **Quality qua peer review** (agent A viết, agent B review)
- **Scale**: 100+ messages → 1 agent overloaded

### 2. BizClaw Multi-Agent Orchestrator

```
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR                           │
│            (bizclaw-agent/orchestrator.rs)               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │              │
│  │ Sales    │  │ Finance  │  │ Legal    │              │
│  │ Claude   │  │ DeepSeek │  │ Groq     │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                      │
│       ▼             ▼             ▼                      │
│  ┌──────────────────────────────────────┐                │
│  │         SYNTHESIZER                  │                │
│  │  Combine responses → unified answer  │                │
│  └──────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

#### 2.1 API Endpoints

```
POST /api/v1/agents           → Create named agent
DELETE /api/v1/agents/{name}  → Delete agent
POST /api/v1/agents/{name}/chat  → Chat with specific agent
POST /api/v1/agents/broadcast    → Send to ALL agents
```

#### 2.2 Mỗi Agent Có Provider Riêng

```
┌─────────────────────────────────────────────────────┐
│  Agent           │  Provider        │  Chi phí      │
├──────────────────┼──────────────────┼───────────────┤
│  Dịch thuật      │  Ollama/qwen3    │  $0 (local)   │
│  Full-Stack Dev  │  Claude 3.5      │  $$$ (mạnh)   │
│  Social Media    │  Gemini Flash    │  $ (nhanh)    │
│  Kế toán         │  DeepSeek Chat   │  $$ (giá tốt) │
│  Helpdesk        │  Groq/llama-3.3  │  $ (nhanh)    │
│  Nội bộ          │  Brain Engine    │  $0 (offline)  │
└─────────────────────────────────────────────────────┘

💰 Tiết kiệm 60-80% chi phí API so với 1 provider cho tất cả
```

### 3. Orchestration Patterns

#### 3.1 Sequential (Tuần tự)

```
Task → Agent A → Result A → Agent B → Result B → Final
```
- **Use case**: Pipeline processing (research → analysis → report)
- **Pros**: Simple, deterministic
- **Cons**: Slow, bottleneck at each step

#### 3.2 Parallel (Song song)

```
        ┌── Agent A → Result A ──┐
Task ──→├── Agent B → Result B ──├──→ Synthesize → Final
        └── Agent C → Result C ──┘
```
- **Use case**: Multi-perspective analysis, Group Chat
- **Pros**: Fast, diverse viewpoints
- **Cons**: Cost = N × single agent

#### 3.3 Hierarchical (Phân cấp)

```
Coordinator → [Assign subtasks]
  ├── Manager A → [Worker 1, Worker 2]
  └── Manager B → [Worker 3, Worker 4]
      → Aggregate → Final
```
- **Use case**: Complex, multi-department tasks
- **Pros**: Scalable, organized
- **Cons**: Most complex, highest cost

### 4. Group Chat — BizClaw's Multi-Agent Feature

```
User: "Chuẩn bị pitch cho nhà đầu tư Series A"

┌─── Group "Pitch Team" ──────────────────────────────┐
│                                                       │
│  🧑‍💼 Agent "Chiến lược" (Claude)                      │
│  → "Thị trường AI Agent Việt Nam đang ở giai đoạn    │
│     Early Adopter. TAM: $50M. SAM: $15M..."          │
│                                                       │
│  📊 Agent "Tài chính" (DeepSeek)                      │
│  → "Unit economics: CAC $50, LTV $600.                │
│     Payback period: 3 tháng. Gross margin: 85%..."    │
│                                                       │
│  📣 Agent "Marketing" (Gemini)                         │
│  → "Brand story: 'AI nhanh, mọi nơi.'                │
│     Go-to-market: Direct sales → Channel partners..." │
│                                                       │
│  ⚖️ Agent "Pháp lý" (Groq)                            │
│  → "Term sheet: SAFE note, $500K.                     │
│     Cap table suggestion: 20% dilution max..."        │
│                                                       │
└───────── All responses → User ──────────────────────┘
```

### 5. Design Principles

1. **Justify multi-agent**: Giải thích TẠI SAO cần > 1 agent
2. **Clear responsibilities**: Mỗi agent chỉ 1 vai trò
3. **Shared context minimum**: Chỉ share cần thiết, tránh context bloat
4. **Cost awareness**: Track cost per agent, per request
5. **Graceful degradation**: 1 agent fail ≠ system fail

---

## 📝 Bài Tập

### Bài 1: Design Agent Team (30 phút)

Thiết kế team 4 agents cho "E-commerce Company":
- Tên + vai trò + provider + chi phí ước tính
- Orchestration pattern (sequential/parallel/hierarchical?)
- Communication flow diagram

### Bài 2: Cost Analysis (20 phút)

So sánh cost cho 1000 queries/ngày:
- **Approach A**: 1 agent GPT-4o cho tất cả
- **Approach B**: 4 agents mixed providers (GPT-4o, DeepSeek, Ollama, Groq)

---

## ⏭️ Buổi Tiếp Theo

**Module 10: Multi-Agent Orchestration (Phần 2)** — Hands-on
