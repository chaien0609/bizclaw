# 🎬 Demo Script — Kịch Bản Demo 30 Phút Cho Khách Hàng

> **Dành cho Trainer** — Đọc trước, tập thử, rồi demo live

---

## Chuẩn Bị Trước Demo

### Checklist (15 phút trước):

- [ ] BizClaw Dashboard đang chạy (mở sẵn tab browser)
- [ ] Ít nhất 1 provider configured (OpenAI hoặc Ollama)
- [ ] 1 agent đã tạo sẵn (phù hợp ngành khách)
- [ ] 3 documents đã upload vào Knowledge
- [ ] Telegram bot đã kết nối (có sẵn trên phone)
- [ ] Tab browser: Dashboard, Chat, Gallery, Traces

---

## Script

### 🟢 Phút 0-5: PITCH

**[Mở slide/màn hình trống — nói trực tiếp]**

Trainer:
> "Xin chào anh/chị. Hôm nay tôi muốn giới thiệu BizClaw — nền tảng AI Agent mà doanh nghiệp tự sở hữu, chạy trên máy mình đi.
>
> Trước tiên, cho tôi hỏi: hiện tại anh/chị đang chi bao nhiêu mỗi tháng cho CSKH? Cho content?
>
> *(Đợi khách trả lời)*
>
> BizClaw giải quyết bằng cách tạo AI Agent chuyên biệt — không phải chatbot thường, mà agent HÀNH ĐỘNG được: đọc file, search web, trả lời đa kênh.
>
> 3 điểm khác biệt:
> 1. Chạy trên Pi miễn phí, Android miễn phí, VPS tuỳ nhu cầu
> 2. Dữ liệu 100% trên máy bạn — encrypted AES-256
> 3. Mỗi agent chọn AI riêng — tiết kiệm 60-80%
>
> Để tôi cho anh/chị xem trực tiếp."

---

### 🟢 Phút 5-10: DASHBOARD TOUR

**[Mở Dashboard → navigate]**

Trainer:
> "Đây là Dashboard — trung tâm điều khiển. Anh/chị thấy:"

**1. Gallery (click vào):**
> "51 agent sẵn sàng — từ CSKH, Sales, HR, Marketing, đến IT. Chọn 1 cái, click Install, 3 giây là xong."

**2. Providers (click vào):**
> "15 nhà cung cấp AI — từ OpenAI cloud đến Ollama miễn phí chạy ngay trên máy. Mỗi agent chọn riêng."

**3. Channels (click vào):**
> "9 kênh: Telegram, Zalo, Discord, Email, WhatsApp... Kết nối 1 lần, agent tự trả lời 24/7."

---

### 🟢 Phút 10-18: LIVE CHAT DEMO

**[Click vào Chat page]**

Trainer:
> "Giờ tôi chat trực tiếp với agent. Đây là agent [Tên], chuyên [nghiệp vụ]."

**Demo 1 — Nghiệp vụ:**
```
Gõ: "Chính sách bảo hành sản phẩm ABC?"
→ Agent trả lời từ Knowledge base
```
> "Câu trả lời này lấy từ tài liệu công ty — anh/chị upload lên, agent tự tìm."

**Demo 2 — Tools (agent hành động):**
```
Gõ: "Hôm nay thứ mấy?"
→ Agent dùng shell tool → trả lời chính xác
```
> "Thấy không? Agent không chỉ NÓI — nó HÀNH ĐỘNG. Chạy lệnh thật trên server."

**Demo 3 — Memory:**
```
Gõ: "Tôi tên [Tên Khách], công ty [Tên công ty KH]"
→ Agent ghi nhớ
[Chat thêm 2-3 câu khác]
Gõ: "Tôi làm ở đâu nhỉ?"
→ Agent: "Anh/chị [Tên] làm tại [Công ty]"
```
> "Agent NHỚ — không như ChatGPT reset mỗi phiên. Tất cả lịch sử được lưu lại."

---

### 🟢 Phút 18-23: CHANNEL DEMO

**[Lấy phone ra, mở Telegram]**

Trainer:
> "Đây mới là điểm hay. Nhân viên/khách hàng không cần mở Dashboard. Họ chat ngay trên Telegram."

```
Mở Telegram → chat bot → gửi tin nhắn → bot trả lời realtime
```

> "Tương tự cho Zalo, Discord, Email. 1 agent, nhiều kênh, nhất quán."

---

### 🟢 Phút 23-28: VALUE PROPOSITION

**[Mở LLM Traces]**

Trainer:
> "Anh/chị có thể theo dõi chi phí real-time. Mỗi request tốn bao nhiêu, agent nào tốn nhất."

**[Show bảng ROI — đã chuẩn bị sẵn]**

```
Chi phí hiện tại:  2 nhân viên × 15tr = 30 triệu/tháng
Chi phí BizClaw:   VPS 200K + API 500K = 700K/tháng
Tiết kiệm:         29.3 triệu/tháng = 97%
```

> "Và quan trọng nhất: dữ liệu không rời khỏi máy anh/chị. Hoàn toàn self-hosted."

---

### 🟢 Phút 28-30: CTA

Trainer:
> "Vậy anh/chị thấy sao? Nghiệp vụ nào muốn bắt đầu đầu tiên?
>
> Chúng tôi triển khai trong 1 ngày: cài đặt, tạo agent, kết nối channel, đào tạo nhân viên.
>
> Muốn thử test ngay bây giờ không ạ?"

---

## ⚠️ Xử Lý Tình Huống

| Khách hỏi | Trainer trả lời |
|-----------|----------------|
| "Khác gì ChatGPT?" | "ChatGPT chỉ nói, BizClaw HÀNH ĐỘNG + NHỚ + ĐA KÊNH + TỰ SỞ HỮU" |
| "Data có an toàn?" | "100% trên máy bạn, AES-256 encrypted, không gửi đi đâu" |
| "Đắt không?" | "BizClaw miễn phí. Chi phí = VPS + API = 500K-1tr/tháng. ROI 4000%" |
| "Tiếng Việt hiểu?" | "Hiểu hoàn hảo. Dùng DeepSeek, qwen3 — optimize cho tiếng Việt" |
| "Cần dev maintain?" | "Không. Admin quản lý qua Dashboard, không cần code" |
| "Nếu agent sai?" | "Quality Gate tự kiểm tra + constraints + max 5 rounds" |
