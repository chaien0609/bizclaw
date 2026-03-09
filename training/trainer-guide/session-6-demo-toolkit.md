# 📖 Session 6: Demo Practice & Trainer Toolkit

> ⏰ **16:00 - 17:00** (1 giờ)  
> 🎯 **Mục tiêu**: Trainer tự demo 30 phút mượt mà + nhận bộ công cụ triển khai

---

## 🎬 Phần A: Demo Practice (30 phút)

### A1: Kịch Bản Demo 30 Phút Cho Khách

```
Phút 0-5:   PITCH
  → Elevator pitch 30s
  → 3 USPs
  → "Để tôi cho anh/chị xem trực tiếp"

Phút 5-10:  DASHBOARD TOUR
  → Mở Dashboard: "Đây là trung tâm điều khiển"
  → Gallery: "51 agent sẵn sàng cho mọi ngành"
  → Providers: "15 nhà cung cấp AI, chọn theo budget"

Phút 10-18: LIVE CHAT DEMO
  → Cài agent từ Gallery (chọn phù hợp ngành khách)
  → Chat: câu hỏi nghiệp vụ → agent trả lời
  → Chat: "Tôi tên [Khách]" → Nhớ tên
  → Chat: yêu cầu dùng tools → agent HẠN ĐỘNG
  → Chat: "Tên tôi là gì?" → Agent nhớ!

Phút 18-23: CHANNEL DEMO
  → Mở Telegram → chat với bot → realtime response
  → "Nhân viên/khách hàng chat ở ĐÂY, không cần mở Dashboard"

Phút 23-28: VALUE PROPOSITION
  → Show LLM Traces: "Chi phí = $X/ngày"
  → ROI slide: "Tiết kiệm 97% vs hiring"
  → 3 platforms: "Pi $0, Android $0, VPS tuỳ nhu cầu"

Phút 28-30: CTA
  → "Anh/chị muốn bắt đầu với nghiệp vụ nào?"
  → "Chúng tôi triển khai trong 1 ngày"
```

### A2: Trainer Thực Hành Demo

**Mỗi Trainer demo cho nhau — 15 phút:**

1. Trainer A demo cho Trainer B (15 phút)
2. Trainer B cho feedback (5 phút)
3. Swap (15 phút + 5 phút)

**Feedback Checklist:**
- [ ] Pitch rõ ràng, tự tin?
- [ ] Dashboard tour mượt, không lúng túng?
- [ ] Chat demo chạy đúng (tools, memory)?
- [ ] Channel demo hoạt động?
- [ ] ROI convincing?
- [ ] CTA rõ ràng?

---

## 🧰 Phần B: Trainer Toolkit (20 phút)

### B1: Tài Liệu Sẵn Sàng

| File | Mục đích | Dùng khi |
|------|---------|---------|
| `cheatsheet.md` | 1-page reference nhanh | Demo, troubleshoot |
| `demo-script.md` | Script demo 30 phút | Trước mặt khách |
| `faq-troubleshoot.md` | Xử lý sự cố | Khách gặp lỗi |
| `customer-workshop-template.md` | Template workshop 2-4h | Đào tạo tại DN |

### B2: Checklist Triển Khai Cho Khách

```
TRƯỚC KHI ĐẾN:
□ Khách có VPS/server? (hoặc chuẩn bị Pi/Docker)
□ Biết khách cần agent cho nghiệp vụ gì?
□ Khách có Telegram/Zalo channel?
□ Chuẩn bị API key (OpenAI hoặc Ollama)

NGÀY TRIỂN KHAI (4-8 giờ):
□ Cài đặt BizClaw
□ Tạo 1-3 agents theo nghiệp vụ
□ Upload tài liệu DN vào Knowledge
□ Kết nối ≥ 1 channel
□ Test 20 câu hỏi thực tế
□ Đào tạo admin (quản lý Dashboard)
□ Đào tạo users (dùng bot trên channel)
□ Bàn giao tài liệu

SAU TRIỂN KHAI:
□ Follow-up 1 tuần (khách còn dùng?)
□ Support hotline (nếu có gói support)
□ Update prompt theo feedback thực tế
```

### B3: Pricing Cho Dịch Vụ Triển Khai

```
Gợi ý mức giá (Trainer tự điều chỉnh):

Basic (1 agent, 1 channel):
  Triển khai: 3-5 triệu
  Training:   2 triệu
  Total:      5-7 triệu

Standard (3 agents, 2 channels, Knowledge):
  Triển khai: 8-12 triệu
  Training:   3 triệu
  Total:      11-15 triệu

Premium (5+ agents, multi-channel, custom):
  Triển khai: 15-25 triệu
  Training:   5 triệu
  Support/tháng: 2-3 triệu
  Total:      22-33 triệu
  
VPS Hosting (nếu quản lý cho khách):
  200-500K/tháng
```

---

## 🎯 Phần C: Tổng Kết & Certification (10 phút)

### Bài Kiểm Tra Nhanh (10 câu)

1. BizClaw chạy trên mấy nền tảng? → 3 (Pi, Android, VPS)
2. Có bao nhiêu providers? → 15
3. Binary size là bao nhiêu? → 12 MB
4. System prompt có mấy phần? → 6
5. Max rounds agent suy luận? → 5
6. Auto-compaction khi context đạt bao nhiêu %? → 70%
7. Agent CSKH budget thấp nên dùng provider nào? → DeepSeek/Groq
8. Upload tài liệu ở trang nào? → Knowledge
9. Telegram bot tạo qua ai? → @BotFather
10. Tiết kiệm bao nhiêu % khi dùng mixed providers? → 60-80%

**Pass: ≥ 8/10 → BizClaw Certified Trainer ✅**

---

## ✅ Final Checkpoint

- [ ] Demo 30 phút mượt mà
- [ ] Bộ toolkit đầy đủ
- [ ] Checklist triển khai sẵn sàng
- [ ] Pass quiz 8/10
- [ ] Tự tin đi gặp khách hàng đầu tiên

---

*🎉 Chúc mừng — Bạn đã là BizClaw Certified Trainer!*
