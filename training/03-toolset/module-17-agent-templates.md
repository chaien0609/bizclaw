# 📖 Module 17: Agent Templates & System Prompts

> **Phase**: 🔧 TOOLSET | **Buổi**: 17/24 | **Thời lượng**: 2 giờ  
> **Skills**: `prompt-engineering`, `prompt-engineer`

---

## 🎯 Mục Tiêu: Tạo custom agent templates cho doanh nghiệp

## 📋 Nội Dung

### 1. Anatomy of an Agent Template

```json
{
  "name": "sales-crm-agent",
  "category": "sales",
  "emoji": "💰",
  "display_name": "Sales CRM Agent",
  "description": "Quản lý CRM, theo dõi lead, báo cáo doanh số",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "system_prompt": "...(see below)...",
  "tools": ["web_search", "file", "http_request", "memory_search"],
  "max_rounds": 5
}
```

### 2. System Prompt Best Practices (Recap from Module 3)

```markdown
# ROLE
Bạn là chuyên viên CRM — quản lý pipeline bán hàng, 
theo dõi lead từ tiếp cận đến chốt deal.

# CONTEXT
Công ty XYZ bán phần mềm quản lý. 
Target: SME Việt Nam, 10-500 nhân viên.
Pipeline stages: Lead → Qualified → Proposal → Negotiation → Won/Lost

# INSTRUCTIONS
1. Ghi nhận lead mới: tên, công ty, số điện thoại, nguồn
2. Cập nhật trạng thái pipeline
3. Tạo báo cáo tuần/tháng
4. Follow-up reminder khi lead 3+ ngày không liên hệ
5. Dùng memory_search để tra cứu lịch sử

# CONSTRAINTS
- KHÔNG tiết lộ giá cho competitor
- KHÔNG cam kết delivery date < 2 tuần
- LUÔN xác nhận lại SĐT và email
- KHÔNG chia sẻ thông tin lead giữa các team

# OUTPUT FORMAT
- Tiếng Việt, chuyên nghiệp
- Dùng bảng cho data tổng hợp
- Summary ≤ 200 từ
- Đánh dấu urgency: 🔴 Critical, 🟡 Medium, 🟢 Low

# EXAMPLES
User: "Có lead mới: Nguyễn Văn A, Công ty ABC, 0901234567"
Agent: "📋 Đã ghi nhận lead mới:
- **Tên**: Nguyễn Văn A
- **Công ty**: ABC  
- **SĐT**: 0901234567
- **Trạng thái**: Lead (mới)
- **Action**: Follow-up trong 24h 🟡"
```

### 3. Creating Custom Templates

#### Step-by-step:

1. **Identify role** → Nghiệp vụ cụ thể
2. **Define context** → Industry, company, constraints
3. **Write instructions** → 5-10 clear tasks
4. **Add constraints** → 3-5 "KHÔNG được"
5. **Set output format** → Language, length, style
6. **Include examples** → 2-3 input/output pairs
7. **Select tools** → Only needed tools (avoid overload)
8. **Choose provider** → Match complexity with cost

### 4. Template Testing Checklist

- [ ] Agent understands its role (ask "Bạn là ai?")
- [ ] Agent follows constraints (test boundary cases)
- [ ] Agent uses correct tools (verify tool selection)
- [ ] Output format consistent (10+ test queries)
- [ ] Memory works (multi-turn conversation test)
- [ ] Edge cases handled (empty input, very long input, off-topic)

### 5. Industry-Specific Templates

| Industry | Agent Name | Key Tools | Provider |
|----------|-----------|-----------|----------|
| F&B | Reservation Agent | calendar, notification | DeepSeek |
| Real Estate | Property Advisor | web_search, file | Claude |
| Education | Student Assistant | knowledge_search, calendar | Gemini |
| Healthcare | Appointment Bot | calendar, http_request | GPT-4o |
| Logistics | Tracking Agent | http_request, notification | Groq |

---

## 📝 Lab: Create Custom Agent (45 phút)

1. Choose your industry
2. Write complete system prompt (6 sections)
3. Select appropriate tools and provider
4. Install on BizClaw Dashboard
5. Test with 10 realistic queries
6. Iterate prompt based on failures

---

## ⏭️ **Module 18: Knowledge RAG & Brain Engine**
