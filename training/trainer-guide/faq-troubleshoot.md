# ❓ FAQ & Troubleshooting — Câu Hỏi Thường Gặp

> **Dành cho Trainer** — Top 30 câu hỏi khách hàng hay hỏi

---

## 🏢 Câu Hỏi Kinh Doanh

### Q: BizClaw có phải trả phí không?
> **A**: BizClaw phần mềm miễn phí (MIT license). Chi phí phát sinh:
> - VPS hosting: 150-500K/tháng (hoặc $0 nếu dùng Pi/Android)
> - API key: tuỳ provider (có free: Ollama, Groq)
> - Triển khai + đào tạo: phí 1 lần (từ trainer)

### Q: Khác gì ChatGPT / Copilot?
> **A**: ChatGPT = chatbot cloud, data gửi lên OpenAI.
> BizClaw = agent platform self-hosted:
> - HÀNH ĐỘNG (13 tools, không chỉ nói)
> - NHỚ (3-tier memory)
> - ĐA KÊNH (Telegram, Zalo, Email...)
> - TỰ SỞ HỮU (data 100% trên máy bạn)
> - ĐA AGENT (mỗi agent 1 provider riêng)

### Q: Data có an toàn không?
> **A**: 100% self-hosted. AES-256 encryption. Không telemetry, không tracking, không gửi data cho bất kỳ server trung gian nào. Audit score: 91/100.

### Q: Tiếng Việt hiểu tốt không?
> **A**: Rất tốt. Recommend dùng DeepSeek Chat hoặc Ollama/qwen3 — optimize cho tiếng Việt/Trung. GPT-4o và Claude cũng hiểu tiếng Việt hoàn hảo.

### Q: Cần dev để maintain không?
> **A**: Không. Admin quản lý qua Web Dashboard (15 trang). Tạo agent, upload docs, kết nối channel — tất cả qua giao diện web. Không cần viết code.

### Q: Agent sai thì sao?
> **A**: BizClaw có 3 lớp bảo vệ:
> 1. System prompt constraints: "KHÔNG được bịa giá"
> 2. Max 5 rounds: tránh vòng lặp vô tận
> 3. Quality Gate: evaluator LLM tự review trước khi trả lời

---

## 🔧 Câu Hỏi Kỹ Thuật

### Q: Cần server cấu hình như nào?
> **A**: Tối thiểu 2 core, 4GB RAM, 20GB disk. Với Ollama cần 16GB RAM.
> Recommended: 4 core, 8GB RAM, 50GB disk.

### Q: Offline được không?
> **A**: Có. Dùng Ollama hoặc Brain Engine → AI chạy 100% local.
> Không cần internet. Perfect cho doanh nghiệp yêu cầu air-gapped.

### Q: Hỗ trợ mấy người dùng cùng lúc?
> **A**: Không giới hạn user. Giới hạn phụ thuộc vào provider rate limit và server resources. 1 VPS nhỏ xử lý thoải mái 100+ concurrent users.

### Q: Backup dữ liệu thế nào?
> **A**: Data lưu trong SQLite files tại `~/.bizclaw/`. Backup = copy folder. Có thể dùng cron job backup daily.

---

## 🚨 Troubleshooting — Sửa Lỗi Nhanh

### Lỗi cài đặt

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `cargo: command not found` | Rust chưa cài | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Build lâu (>20 phút) | RAM thấp | Thêm swap: `sudo fallocate -l 2G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Binary crash on VPS | Build trên macOS | Phải build trực tiếp trên VPS Linux |
| Port already in use | Service cũ đang chạy | `sudo lsof -i :3579` → kill process |

### Lỗi Dashboard

| Lỗi | Fix |
|-----|-----|
| Trang trắng | Hard refresh: `Ctrl+Shift+R` |
| Agents dropdown trống | Clear browser cache, đợi 5s |
| WebSocket disconnect | Kiểm tra port forwarding / Nginx |
| Settings không lưu | Kiểm tra disk space (`df -h`) |

### Lỗi Agent

| Lỗi | Fix |
|-----|-----|
| Agent không trả lời | Check provider API key + model name |
| Trả lời sai nghiệp vụ | Cải thiện system prompt (thêm examples) |
| Quên context | Memory full → trigger auto-compaction |
| Dùng sai tool | Thêm examples trong tool description |
| Loop vô tận | Max rounds = 5 (đã built-in) |

### Lỗi Channel

| Lỗi | Fix |
|-----|-----|
| Telegram bot không reply | 1. Check token 2. Restart service 3. Re-create bot |
| "Unauthorized" | Token expired → tạo mới từ @BotFather |
| Email không nhận | Check IMAP settings, App-specific password |
| Webhook 404 | Webhook route phải public (không behind auth) |

### Lỗi Performance

| Lỗi | Fix |
|-----|-----|
| Response > 10s | Switch to faster provider (Groq, Gemini Flash) |
| RAM > 80% | Giảm Ollama model size (dùng phi3 thay llama3) |
| DB locked | Enable WAL: restart service |
| Disk full | Clear old logs, compaction files |

---

## 💡 Tips Cho Trainer

1. **Luôn test trước khi demo**: 15 phút setup + verify
2. **Chuẩn bị backup provider**: Nếu OpenAI down → switch Ollama
3. **Có sẵn hotspot**: WiFi khách có thể chậm/block
4. **Screenshot mọi thứ**: Lỡ live demo fail → show screenshot
5. **Bình tĩnh khi lỗi**: "Đây là environment, production sẽ ổn định hơn"
