# 🏢 Customer Workshop Template — Mẫu Đào Tạo Tại Doanh Nghiệp

> **Dành cho Trainer** — Template workshop 2-4 giờ khi triển khai tại DN khách hàng

---

## 📋 Thông Tin Workshop

| | Chi tiết |
|--|---------|
| **Thời lượng** | 2 giờ (basic) hoặc 4 giờ (full) |
| **Đối tượng** | Admin IT + Users (nhân viên dùng bot) |
| **Yêu cầu** | BizClaw đã được cài đặt + agents đã tạo |
| **Output** | Nhân viên tự dùng bot, Admin tự quản lý |

---

## ⏰ Lịch Trình 2 Giờ (Basic)

```
00:00-00:20  Giới thiệu: AI Agent là gì? Demo live
00:20-00:40  Hướng dẫn Users: Dùng bot trên Telegram/Zalo
00:40-01:00  Thực hành: Users tự chat với bot
01:00-01:20  Hướng dẫn Admin: Dashboard basics
01:20-01:40  Thực hành: Admin tạo agent, upload docs
01:40-02:00  Q&A + Bàn giao
```

## ⏰ Lịch Trình 4 Giờ (Full)

```
SÁNG (2 giờ):
00:00-00:30  Giới thiệu: AI Agent, demo live
00:30-01:00  Users: Dùng bot (Telegram + Web Chat)
01:00-01:30  Users thực hành: 20 câu hỏi thực tế
01:30-02:00  Q&A Users + Tips sử dụng hiệu quả

☕ Break 15 phút

CHIỀU (2 giờ):
02:15-02:45  Admin: Dashboard tour + Agent management
02:45-03:15  Admin: Knowledge RAG + Channel management
03:15-03:45  Admin thực hành: Tạo agent mới, upload docs
03:45-04:00  Bàn giao: Tài liệu, support contact
```

---

## 🎯 Nội Dung Đào Tạo

### Phần 1: Cho Users (Nhân viên dùng bot)

**Slide 1: AI Bot của công ty mình**
```
"Từ hôm nay, công ty mình có bot AI riêng.
 Bot này hiểu nghiệp vụ công ty, nhớ lịch sử chat,
 và trả lời 24/7.

 Các bạn dùng qua [Telegram/Zalo] — không cần cài thêm gì."
```

**Slide 2: Cách dùng**
```
1. Mở [Telegram/Zalo] → tìm bot "[Tên Bot]"
2. Gõ câu hỏi → bot trả lời
3. Bot nhớ tên bạn — không cần giới thiệu lại mỗi lần
4. Bot biết về: [sản phẩm/chính sách/quy trình của công ty]
```

**Slide 3: Tips**
```
✅ Hỏi cụ thể: "Chính sách bảo hành iPhone 15?"
❌ Hỏi chung: "Cho tôi biết mọi thứ"

✅ Cung cấp context: "Khách hàng Nguyễn Văn A gọi khiếu nại đơn #1234"
❌ Thiếu context: "Có khách phàn nàn"

✅ Hỏi lại nếu chưa rõ: "Nói chi tiết hơn về điều kiện đổi trả"
```

**Slide 4: Bot KHÔNG làm được**
```
⚠️ Bot không phải biết hết — nếu bot nói "không biết" → liên hệ [người/phòng]
⚠️ Bot không thay thế quyết định quan trọng — luôn double-check
⚠️ Không gửi mật khẩu/thông tin nhạy cảm cho bot
```

---

### Phần 2: Cho Admin (Quản lý hệ thống)

**Admin cần biết 5 việc:**

#### 1. Quản lý Agents
```
Dashboard → Agents
- Xem danh sách agents
- Edit system prompt (khi chính sách thay đổi)
- Tạo agent mới cho nghiệp vụ mới
```

#### 2. Quản lý Knowledge
```
Dashboard → Knowledge
- Upload tài liệu mới (FAQ, chính sách, bảng giá)
- Xoá tài liệu cũ
- Test search: "thử hỏi về bảo hành"
```

#### 3. Theo dõi chi phí
```
Dashboard → Traces
- Xem cost per request
- Xem agent nào tốn nhất
- Monthly total
```

#### 4. Quản lý Channels
```
Dashboard → Channels
- Check status (✅ Connected / ❌ Error)
- Update token nếu cần
```

#### 5. Xử lý sự cố
```
Agent sai → Sửa system prompt (thêm examples / constraints)
Agent chậm → Đổi provider (Groq nhanh hơn)
Agent không nhớ → Upload thêm docs vào Knowledge
Channel ngắt → Check token, restart service
```

---

## 📄 Tài Liệu Bàn Giao Cho Khách

### Checklist bàn giao:

- [ ] **Tài khoản Dashboard**: URL, username, password
- [ ] **Agent list**: Tên, vai trò, provider của mỗi agent
- [ ] **Channel info**: Bot name, kênh đã kết nối
- [ ] **Knowledge docs**: Danh sách tài liệu đã upload
- [ ] **Quick guide**: 1 trang hướng dẫn user + 1 trang admin
- [ ] **Support contact**: SĐT/email trainer khi cần hỗ trợ
- [ ] **Cheatsheet**: In 1 bản cho Admin

### Template Quick Guide (1 trang cho User):

```
🤖 [TÊN BOT] — Hướng Dẫn Sử Dụng

📱 Cách dùng:
1. Mở [Telegram/Zalo]
2. Tìm bot "[Tên]" 
3. Gõ câu hỏi → nhận trả lời

💡 Bot biết về:
- [Topic 1]
- [Topic 2]
- [Topic 3]

⚠️ Lưu ý:
- Bot không phải lúc nào cũng đúng
- Câu hỏi quan trọng → confirm với quản lý
- Không gửi mật khẩu cho bot

📞 Hỗ trợ: [SĐT Trainer]
```

---

## 💼 Post-Workshop Follow-up

### Tuần 1 sau triển khai:
- [ ] Gọi khách: "Bot chạy ổn không?"
- [ ] Check usage stats (nếu có access)
- [ ] Sửa prompt nếu có feedback

### Tháng 1 sau triển khai:
- [ ] Review: agent nào hữu ích nhất?
- [ ] Propose: thêm agent cho nghiệp vụ mới?
- [ ] Upsell: thêm channels, thêm agents, support package

---

*Template này customize theo từng khách hàng. Thay `[...]` bằng thông tin thực tế.*
