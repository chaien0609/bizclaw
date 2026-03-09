# 📖 Module 11: LLM Integration & Provider Management

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 11/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `llm-app-patterns`, `ai-product`

---

## 🎯 Mục Tiêu Học Tập

- [ ] Hiểu 15 providers của BizClaw và khi nào dùng cái nào
- [ ] Nắm vững OpenAI-compatible API pattern
- [ ] Cấu hình provider credentials an toàn
- [ ] Implement fallback strategy giữa providers

---

## 📋 Nội Dung

### 1. BizClaw Provider Ecosystem

| # | Provider | Type | Cost | Best For |
|---|----------|------|------|----------|
| 1 | **OpenAI** | Cloud | $$$ | General, function calling |
| 2 | **Anthropic** | Cloud | $$$ | Coding, reasoning |
| 3 | **Gemini** | Cloud | $ | Fast, multimodal |
| 4 | **DeepSeek** | Cloud | $$ | Value, Chinese/Vietnamese |
| 5 | **Groq** | Cloud | $ | Ultra-fast inference |
| 6 | **OpenRouter** | Cloud | Varies | Access all models |
| 7 | **Together** | Cloud | $$ | Open-source models |
| 8 | **MiniMax** | Cloud | $ | Chinese market |
| 9 | **xAI (Grok)** | Cloud | $$ | Real-time data |
| 10 | **Mistral** | Cloud | $$ | European compliance |
| 11 | **Ollama** | Local | FREE | Self-hosted LLMs |
| 12 | **llama.cpp** | Local | FREE | Raw GGUF inference |
| 13 | **Brain Engine** | Local | FREE | Offline, SIMD optimized |
| 14 | **CLIProxy** | Proxy | - | Bridge to any CLI |
| 15 | **vLLM** | Self-hosted | - | High-throughput serving |

### 2. Provider Selection Strategy

```
Decision Tree:

Budget = $0?
├── Yes → Ollama / Brain Engine
│   ├── Need offline? → Brain Engine (GGUF + SIMD)
│   └── Need variety? → Ollama (pull any model)
│
└── No → Cloud Provider
    ├── Need best quality? → Claude / GPT-4o
    ├── Need speed? → Groq / Gemini Flash  
    ├── Need value? → DeepSeek / Together
    └── Need everything? → OpenRouter (routes to all)
```

### 3. OpenAI-Compatible API

BizClaw exposes `/v1/chat/completions` — drop-in replacement:

```bash
# Use BizClaw as backend for Cursor, Aider, Continue...
curl http://localhost:3579/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bizclaw",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 4. Fallback Strategy

```
Primary (Claude) → Fallback 1 (GPT-4o) → Fallback 2 (DeepSeek)

Implementation:
  try:
    response = claude.chat(messages)
  except RateLimitError:
    response = gpt4o.chat(messages)
  except APIError:
    response = deepseek.chat(messages)
  finally:
    log_provider_used()
```

### 5. Security: Credential Management

```
Dashboard → Providers → Nhập API key → 💾 Save

Storage: SQLite (AES-256 encrypted)
Display: ABCD•••• (masked)
API response: Never expose full key

Best practices:
  - Rotate keys monthly
  - Set usage limits per key
  - Monitor cost per provider
  - Use env vars on VPS: OPENAI_API_KEY=sk-...
```

---

## 📝 Bài Tập

### Lab: Configure 3 Providers (20 phút)
1. Setup OpenAI (cloud)
2. Setup Ollama (local)
3. Test both via Dashboard Chat
4. Compare: latency, quality, cost

---

## ⏭️ Buổi Tiếp Theo

**Module 12: Cost Optimization & Prompt Caching**
