# 📖 Session 4: Channels & Knowledge RAG

> ⏰ **13:30 - 14:30** (1 giờ)  
> 🎯 **Mục tiêu**: Kết nối Telegram/Zalo + Upload tài liệu DN cho agent

---

## 📱 Phần A: Kết Nối Channels (30 phút)

### A1: Telegram — Setup 5 Phút

**Trainer demo trước, rồi khách tự làm theo:**

```
1. Mở Telegram → tìm @BotFather → /start
2. /newbot → đặt tên: "[Tên_Công_Ty] AI Bot"
3. Nhận token: 7234567890:AAH...
4. Dashboard → Channels → Telegram → Paste token → Enable → Save
5. Chat với bot trên Telegram → agent trả lời!
```

**Troubleshoot phổ biến:**
| Vấn đề | Nguyên nhân | Fix |
|--------|-------------|-----|
| Bot không trả lời | Token sai | Copy lại từ BotFather |
| Trả lời chậm | Provider chậm | Đổi sang Groq/Gemini |
| Lỗi "Unauthorized" | Token cũ/revoked | Tạo token mới |

### A2: Kết Nối Nhanh Theo Kênh

| Kênh | Thời gian setup | Độ khó | Phổ biến VN |
|------|----------------|--------|-------------|
| **Telegram** | 5 phút | ⭐ | ⭐⭐⭐ |
| **Discord** | 10 phút | ⭐⭐ | ⭐⭐ |
| **Email** | 15 phút | ⭐⭐ | ⭐⭐⭐ |
| **Webhook** | 5 phút | ⭐ | ⭐⭐ |
| **Zalo** | 20 phút | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **WhatsApp** | 30 phút | ⭐⭐⭐ | ⭐⭐ |

**Khuyến nghị cho Trainer:** Demo = Telegram (dễ nhất). Triển khai VN = ưu tiên Zalo.

### A3: Multi-Channel — 1 Agent Nhiều Kênh

```
1 Agent "CSKH" có thể đồng thời nhận tin từ:
├── 💬 Telegram  → Khách hàng quốc tế
├── 💜 Discord   → Team nội bộ
├── 📧 Email     → Ticket chính thức
├── 🌐 Web Chat  → Website
└── 📱 Zalo      → Khách hàng VN

Cùng 1 brain, cùng 1 knowledge base, cùng 1 memory
→ Nhất quán trên mọi kênh
```

---

## 📚 Phần B: Knowledge RAG — Upload Tài Liệu (30 phút)

### B1: Tại Sao Cần Upload Tài Liệu?

```
KHÔNG có Knowledge:
  User: "Chính sách bảo hành?"
  Agent: "Tôi không có thông tin cụ thể." ← FAIL

CÓ Knowledge:
  User: "Chính sách bảo hành?"
  Agent: [Tìm trong knowledge base]
  Agent: "Sản phẩm được bảo hành 12 tháng tại tất cả chi nhánh.
          Đổi mới trong 30 ngày nếu lỗi nhà sản xuất." ← WIN
```

### B2: Upload Tài Liệu — 3 Bước

```
Dashboard → Knowledge → Upload

Bước 1: Chuẩn bị files (PDF, DOCX, CSV, TXT, MD)
Bước 2: Upload → Đặt tên rõ ràng
Bước 3: Test → Search thử "chính sách đổi trả"
```

### B3: Tài Liệu Nên Upload Cho Khách Hàng

| Loại tài liệu | Ưu tiên | Ví dụ |
|---------------|---------|-------|
| **FAQ** | ⭐⭐⭐ | 50 câu hỏi thường gặp |
| **Chính sách** | ⭐⭐⭐ | Bảo hành, đổi trả, giao hàng |
| **Bảng giá** | ⭐⭐⭐ | Products + prices (CSV) |
| **SOP** | ⭐⭐ | Quy trình xử lý khiếu nại |
| **Hướng dẫn** | ⭐⭐ | Cách sử dụng sản phẩm |
| **Giới thiệu** | ⭐ | About us, lịch sử công ty |

### B4: Tips Cho Tài Liệu Chất Lượng

```
✅ DO:
  - 1 file = 1 chủ đề (dễ tìm)
  - Đặt tên file rõ ràng: "bao-hanh-san-pham-2026.md"
  - Cấu trúc rõ (headings, bullet points)
  - Cập nhật khi thay đổi

❌ DON'T:
  - 1 file mega 100 trang → chia nhỏ
  - File scan mờ → OCR trước
  - Thông tin lỗi thời → gỡ bỏ
```

### B5: Lab — Upload & Test (10 phút)

```
1. Tạo file "faq.md" với 10 Q&A
2. Upload lên Knowledge
3. Chat: hỏi 5 câu trong FAQ → verify agent trả lời đúng
4. Hỏi 2 câu KHÔNG có trong FAQ → verify agent nói "không biết"
```

---

## ✅ Checkpoint Session 4

- [ ] Kết nối Telegram bot thành công (< 5 phút)
- [ ] Biết setup 3+ channels
- [ ] Upload 3 documents thành công
- [ ] Test RAG search — agent trả lời từ tài liệu
- [ ] Biết troubleshoot lỗi channel phổ biến

---

*☕ Break 15 phút → Session 5*
