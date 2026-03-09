# 📖 Session 1: BizClaw Pitch & Core Concepts

> ⏰ **08:30 - 09:30** (1 giờ)  
> 🎯 **Mục tiêu**: Trainer có thể pitch BizClaw cho khách hàng trong 5-10 phút

---

## 🗣️ Phần A: Elevator Pitch (15 phút)

### Pitch 30 giây

> *"BizClaw là nền tảng AI Agent tự triển khai, doanh nghiệp nào cũng chạy được — từ Raspberry Pi miễn phí đến VPS production. 1 codebase Rust, 15 nhà cung cấp AI, 9 kênh liên lạc, 51 mẫu agent sẵn sàng. Dữ liệu 100% nằm trên máy bạn, không qua bất kỳ server trung gian nào."*

### Pitch 5 phút — Script cho Trainer

```
HOOK (30s):
"Hiện tại anh/chị đang tốn bao nhiêu cho nhân viên CSKH mỗi tháng?
 15 triệu? 20 triệu? Nếu tôi nói BizClaw giải quyết việc đó 
 với chi phí 0 đồng — trên 1 chiếc điện thoại cũ?"

PROBLEM (1 phút):
"Doanh nghiệp VN đang gặp 3 bài toán:
 1. Chi phí nhân sự CSKH/content/báo cáo ngày càng tăng
 2. Dữ liệu gửi lên ChatGPT = mất kiểm soát
 3. Mỗi nhân viên 1 cách dùng AI = không đồng bộ"

SOLUTION (2 phút):
"BizClaw giải quyết cả 3:
 ✅ 51 agent chuyên biệt thay thế công việc lặp di lặp lại
 ✅ Dữ liệu 100% trên máy bạn — AES-256 encrypted
 ✅ 1 platform quản lý tất cả — dashboard, tracing, cost

 Và đây là điểm khác biệt:
 🍓 Chạy trên Raspberry Pi = $0/tháng
 📱 Chạy trên Android = $0/tháng, AI tự điều khiển Facebook/Zalo
 🖥️ Chạy trên VPS = tuỳ nhu cầu, 50+ agents"

PROOF (1 phút):
"BizClaw đang chạy production tại bizclaw.vn
 - 17 crates Rust, 41,000 dòng code
 - 240 tests passing
 - Audit score: 91/100
 - Binary chỉ 12MB — nhẹ hơn 1 bức ảnh"

CTA (30s):
"Để tôi demo trực tiếp cho anh/chị xem. 
 Chỉ mất 15 phút."
```

### 3 USPs Cốt Lõi (nhớ thuộc)

| # | USP | 1-Line |
|---|-----|--------|
| 1 | **3 nền tảng, 1 codebase** | Pi ($0) + Android ($0) + VPS |
| 2 | **Self-hosted, Local-first** | Dữ liệu không rời khỏi máy |
| 3 | **Per-agent provider** | Mỗi agent chọn AI riêng → tiết kiệm 60-80% |

---

## 🧠 Phần B: Core Concepts (30 phút)

### B1: AI Agent vs Chatbot — Khác Biệt Cốt Lõi

```
Chatbot: Hỏi → Trả lời cố định
Agent:   Hỏi → Suy luận → Dùng tools → Hành động → Trả lời
```

**Demo nhanh cho Trainer:**
```
User: "File nào lớn nhất trong thư mục /data?"
                    ↓
Agent suy luận: "Cần dùng shell command"
Agent hành động: shell.execute("du -sh /data/* | sort -rh | head -5")
Agent quan sát:  backup.sql 2.3GB, logs.tar 890MB
Agent trả lời:   "File lớn nhất là backup.sql (2.3 GB)."

→ Agent HÀNH ĐỘNG, không chỉ NÓI
```

### B2: Kiến Trúc BizClaw — Giải Thích Đơn Giản

```
15 AI Providers ─┐
(OpenAI, Ollama, │   🤖 Agent Brain
 Gemini, etc.)   ├──→ Think → Act → Observe → Trả lời
                  │   
13 Tools ─────────┤   🧠 Memory: Nhớ mọi cuộc hội thoại
(Shell, File,     │   📚 Knowledge: Tra cứu tài liệu DN
 Web Search...)   │   
                  │   
9 Channels ───────┘
(Telegram, Discord, Email, Zalo, WhatsApp...)
```

**Key numbers cho Trainer nhớ:**

| Con số | Ý nghĩa |
|--------|---------|
| **17** crates | Module hoá, mỗi crate 1 chức năng |
| **15** providers | OpenAI → Brain Engine, cloud → offline |
| **9** channels | Đa kênh: Telegram, Zalo, Email... |
| **13** tools | Agent tự hành động |
| **51** templates | Agent sẵn sàng, cài 1 click |
| **3** tầng memory | Brain → Daily logs → FTS5 search |
| **5** rounds max | Giới hạn suy luận → tránh vòng lặp |
| **12 MB** | Binary size — nhẹ hơn 1 ảnh |

### B3: Pricing Positioning

```
BizClaw KHÔNG BÁN:
  ❌ Subscription/tháng
  ❌ Per-user license
  ❌ API usage fee

BizClaw BÁN:
  ✅ Triển khai + đào tạo (1 lần)
  ✅ Support package (tuỳ chọn)
  ✅ Custom agent development
  ✅ VPS hosting (nếu khách cần)

→ Khách hàng SỞ HỮU phần mềm, không thuê
```

---

## 🎯 Phần C: Xác Định Khách Hàng Mục Tiêu (15 phút)

### Target Segments

| Segment | Pain Point | BizClaw Solution | Giá trị |
|---------|-----------|-------------------|---------|
| **SME (10-50 NV)** | CSKH tốn nhân sự | 1 agent Telegram/Zalo | Tiết kiệm 15-20tr/tháng |
| **Agency/Freelancer** | Quản lý content nhiều KH | Multi-tenant, mỗi KH 1 bot | Scale không giới hạn |
| **Startup** | Budget hạn hẹp, cần AI | Pi/Android = $0 | Zero infrastructure cost |
| **Enterprise (50+)** | Data privacy, compliance | Self-hosted, AES-256 | 100% data sovereignty |
| **Education** | Hỗ trợ học viên 24/7 | Knowledge RAG + FAQ agent | Giảm workload giảng viên |

### Câu Hỏi Khám Phá Nhu Cầu

**Trainer hỏi khách hàng:**

1. "Hiện tại team nào trong công ty tốn nhiều thời gian cho công việc lặp lại nhất?"
2. "Mỗi tháng chi bao nhiêu cho CSKH / Content / Báo cáo?"
3. "Dữ liệu nào của công ty KHÔNG THỂ gửi lên cloud?"
4. "Khách hàng liên hệ qua kênh nào nhiều nhất?"
5. "Nếu có 1 AI agent chạy 24/7, bạn muốn nó làm gì ĐẦU TIÊN?"

---

## ✅ Checkpoint Session 1

Trainer phải trả lời được:
- [ ] Pitch 30 giây + 5 phút
- [ ] 3 USPs của BizClaw
- [ ] Phân biệt Agent vs Chatbot
- [ ] Key numbers (17, 15, 9, 13, 51, 12MB)
- [ ] 5 câu hỏi khám phá nhu cầu khách

---

*☕ Break 15 phút → Session 2*
