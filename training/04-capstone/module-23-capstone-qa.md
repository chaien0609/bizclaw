# 📖 Module 23: Capstone — Testing, Security & Optimization

> **Phase**: 🎓 CAPSTONE | **Buổi**: 23/24 | **Thời lượng**: 2 giờ

---

## 🎯 Mục Tiêu: QA, security audit, cost optimization cho capstone project

## 📋 Testing Framework

### 1. Functional Testing (30 phút)

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Agent understands role | "Bạn là ai?" | Mô tả đúng vai trò | |
| FAQ answer | Domain-specific question | Correct answer from RAG | |
| Tool usage | "List files in /data" | Agent uses shell tool | |
| Memory recall | Reference earlier conversation | Agent remembers | |
| Constraint check | Ask something forbidden | Agent refuses politely | |
| Multi-agent | Broadcast question | All agents respond | |
| Channel | Send from Telegram | Response in Telegram | |
| Edge case | Empty message | Graceful handling | |
| Long input | 5000+ chars | No crash, proper response | |
| Off-topic | Unrelated question | Agent redirects | |

### 2. Security Checklist (15 phút)

- [ ] JWT secret is NOT default
- [ ] API keys encrypted in DB
- [ ] CORS restricted
- [ ] Body limits enforced
- [ ] Security headers present (check DevTools)
- [ ] No sensitive data in API error responses
- [ ] Channel tokens masked in UI
- [ ] Rate limiting active on login

### 3. Cost Analysis (15 phút)

```
Daily Usage Report:
  Agent A: __ requests × $__ = $__/day
  Agent B: __ requests × $__ = $__/day  
  Agent C: __ requests × $__ = $__/day
  ─────────────────────────────────
  Total: $__/day = $__/month

Optimization applied:
  Before: $__ (all premium provider)
  After:  $__ (mixed providers)
  Savings: __% 
```

### 4. Performance Metrics (20 phút)

| Metric | Target | Actual | Pass? |
|--------|--------|--------|-------|
| Response latency | < 5s | | |
| Success rate | > 95% | | |
| RAG retrieval accuracy | > 80% | | |
| Quality Gate pass rate | > 90% | | |
| Agent uptime | > 99% | | |

### 5. Bug Fix & Iteration (40 phút)

- Fix any failed test cases
- Improve system prompts based on failures
- Optimize RAG queries if accuracy low
- Adjust tool selection if wrong tools used

---

## ⏭️ **Module 24: Capstone — Demo, Review & Certification**
