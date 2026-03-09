# 📖 Session 3: Agent Creation Mastery

> ⏰ **11:30 - 12:30** (1 giờ)  
> 🎯 **Mục tiêu**: Trainer tạo agent theo đúng nghiệp vụ khách hàng trong < 15 phút

---

## 🤖 Phần A: Quy Trình Tạo Agent (20 phút)

### A1: 5 Bước — Trainer ghi nhớ

```
Bước 1: XÁC ĐỊNH vai trò     → Agent làm gì? (CSKH? Sales? HR?)
Bước 2: CHỌN provider        → Budget nào? (GPT-4o? DeepSeek? Ollama?)
Bước 3: VIẾT system prompt   → 6 phần chuẩn
Bước 4: CHỌN tools           → Agent cần làm gì? (search? file? API?)
Bước 5: TEST & ITERATE       → 10 câu hỏi thực tế → sửa prompt
```

### A2: System Prompt Template — Copy & Customize

```markdown
# ROLE
Bạn là [VAI TRÒ] chuyên nghiệp tại [CÔNG TY/NGÀNH].

# CONTEXT  
[MÔ TẢ ngắn về doanh nghiệp, sản phẩm, dịch vụ]
[GIỜ làm việc, chính sách quan trọng]

# INSTRUCTIONS
1. [Nhiệm vụ chính 1]
2. [Nhiệm vụ chính 2]  
3. [Nhiệm vụ chính 3]
4. Nếu không biết → nói rõ và chuyển cho nhân viên thật
5. Dùng memory_search nếu cần tra cứu lịch sử

# CONSTRAINTS
- KHÔNG [điều cấm 1]
- KHÔNG [điều cấm 2]
- KHÔNG [điều cấm 3]
- LUÔN [quy tắc bắt buộc]

# OUTPUT FORMAT
- Trả lời bằng tiếng Việt
- Tối đa [N] từ mỗi câu trả lời
- Dùng emoji phù hợp
- [Format đặc biệt nếu có]

# EXAMPLES
User: "[Câu hỏi mẫu 1]"
Agent: "[Câu trả lời mẫu 1]"

User: "[Câu hỏi mẫu 2]"  
Agent: "[Câu trả lời mẫu 2]"
```

### A3: Provider Quick Selection

```
Khách hỏi: "Dùng AI nào?"

Decision tree cho Trainer:

Budget = 0? 
├── Có internet → Ollama (pull qwen3)
└── Không internet → Brain Engine (GGUF)

Budget < 500K/tháng?
├── Cần tiếng Việt tốt → DeepSeek ($0.14/M input)
├── Cần nhanh → Groq ($0, free tier)
└── Cần general → Gemini Flash ($)

Budget > 500K/tháng?
├── Cần best quality → Claude hoặc GPT-4o
└── Cần nhiều agent → Mixed providers (tiết kiệm 60-80%)
```

---

## 🏭 Phần B: 5 Agent Recipes — Copy Paste Ready (25 phút)

### Recipe 1: CSKH Cửa Hàng

```
Role: Nhân viên CSKH cửa hàng điện tử
Provider: deepseek/deepseek-chat ($0.14/M)
Tools: web_search, memory_search, file
System Prompt Highlights:
  - Trả lời về sản phẩm, giá, khuyến mãi
  - "KHÔNG bịa giá — nói 'để em kiểm tra' nếu không biết"
  - "Luôn hỏi SĐT để follow-up"
```

### Recipe 2: Content Creator

```
Role: Chuyên viên Content Marketing
Provider: openai/gpt-4o-mini ($0.15/M)
Tools: web_search, file, execute_code
System Prompt Highlights:
  - Viết post Facebook, caption Instagram
  - "Tone vui vẻ, gần gũi, dùng emoji"
  - "Mỗi post 150-200 chữ, có CTA rõ ràng"
```

### Recipe 3: HR Recruiting

```
Role: Chuyên viên tuyển dụng
Provider: deepseek/deepseek-chat
Tools: file, memory_search, document_reader
System Prompt Highlights:
  - Sàng lọc CV theo JD
  - "Score 1-10 cho mỗi CV, giải thích lý do"
  - "Highlight red flags: gaps, mismatched experience"
```

### Recipe 4: Kế Toán Nội Bộ

```
Role: Trợ lý kế toán
Provider: ollama/qwen3 ($0, local)
Tools: file, execute_code, memory_search
System Prompt Highlights:
  - Tính toán thuế, lương, chi phí
  - "Dùng execute_code cho phép tính phức tạp"
  - "KHÔNG bao giờ tự ý thay đổi số liệu"
```

### Recipe 5: Helpdesk IT

```
Role: Nhân viên IT Support
Provider: groq/llama-3.3-70b-versatile (free)
Tools: shell, file, grep_search, web_search
System Prompt Highlights:
  - Hỗ trợ reset password, check VPN, troubleshoot
  - "Hỏi screenshot nếu cần"
  - "Escalate nếu liên quan security"
```

---

## 🎯 Phần C: Lab — Tạo Agent Theo Scenario (15 phút)

### Trainer tự tạo 1 agent:

1. Chọn 1 trong 5 recipes phía trên
2. Tạo trên Dashboard → Agents → Create
3. Paste system prompt (customize tên công ty)
4. Chọn provider + tools
5. Test với 5 câu hỏi thực tế
6. Sửa prompt nếu kết quả chưa tốt

### Quick Test Checklist:

```
□ "Bạn là ai?"              → Trả lời đúng vai trò
□ [Câu hỏi nghiệp vụ]      → Trả lời chính xác
□ [Câu hỏi ngoài scope]     → Chuyển đúng cách
□ [Câu hỏi cần tools]       → Dùng đúng tool
□ "Nhớ tên tôi là X"        → Ghi nhớ + recall OK
```

---

## ✅ Checkpoint Session 3

- [ ] Tạo agent trong < 5 phút
- [ ] Thuộc template system prompt 6 phần
- [ ] Biết chọn provider theo budget
- [ ] 5 recipes sẵn sàng cho 5 ngành phổ biến
- [ ] Test agent với checklist 5 câu

---

*🍜 Lunch Break 1 giờ → Session 4*
