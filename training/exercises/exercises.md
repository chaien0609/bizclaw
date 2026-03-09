# 📝 Bài Tập Tổng Hợp

## Exercise 01: Mindmap AI Agent Cho Doanh Nghiệp

### Yêu cầu:
Vẽ mindmap phân tích cách triển khai AI Agent cho 1 doanh nghiệp cụ thể.

### Template:

```
                    [Tên Doanh Nghiệp]
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
     [Nghiệp vụ 1]  [Nghiệp vụ 2]  [Nghiệp vụ 3]
           │              │              │
     Input → Agent   Input → Agent  Input → Agent
     → Action        → Action       → Action
     → Output        → Output       → Output
           │              │              │
     Level: ?        Level: ?       Level: ?
     Provider: ?     Provider: ?    Provider: ?
     Cost: ?         Cost: ?        Cost: ?
```

### Đánh giá:
- ≥ 5 nghiệp vụ phân tích: Xuất sắc
- 3-4 nghiệp vụ: Đạt
- < 3 nghiệp vụ: Cần cải thiện

---

## Exercise 02: Thiết Kế Agent System

### Yêu cầu:
Thiết kế hoàn chỉnh agent system cho 1 trong 5 industries:

1. **F&B** — Chuỗi nhà hàng
2. **Retail** — Cửa hàng online
3. **Healthcare** — Phòng khám
4. **Education** — Trung tâm đào tạo
5. **Real Estate** — Sàn bất động sản

### Output bắt buộc:

1. **Agent Team** (≥ 3 agents)
   - Name, role, provider, model, tools
   
2. **System Prompts** (đầy đủ 6 phần cho mỗi agent)

3. **Architecture Diagram**
   - Data flow
   - Channel mapping
   - Security model

4. **Cost Estimation**
   - Per-agent breakdown
   - Monthly total

5. **Deployment Plan**
   - Infrastructure (VPS/Pi/Android?)
   - Channels
   - Monitoring

---

## Exercise 03: Deploy Complete Agent

### Yêu cầu:
Deploy 1 agent hoàn chỉnh trên BizClaw:

### Checklist:

- [ ] BizClaw installed and running
- [ ] Provider configured (≥ 1)
- [ ] Agent created with custom system prompt
- [ ] ≥ 3 documents in Knowledge Base
- [ ] ≥ 1 channel connected (Telegram recommended)
- [ ] Tested with 10 real queries
- [ ] Cost tracked via LLM Traces
- [ ] Screenshot of working system

### Grading:

| Item | Points |
|------|--------|
| Installation correct | 10 |
| System prompt quality | 20 |
| Knowledge base complete | 15 |
| Channel working | 15 |
| 10/10 test queries pass | 20 |
| Cost analysis | 10 |
| Documentation | 10 |
| **Total** | **100** |
