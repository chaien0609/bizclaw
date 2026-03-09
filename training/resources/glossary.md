# 📖 Glossary — Bảng Thuật Ngữ AI Agent

| Thuật ngữ | Tiếng Việt | Định nghĩa |
|-----------|-----------|-------------|
| **AI Agent** | Tác tử AI | Hệ thống AI tự suy luận, hành động, và quan sát kết quả |
| **LLM** | Mô hình ngôn ngữ lớn | Large Language Model — bộ não suy luận của agent |
| **Provider** | Nhà cung cấp | Dịch vụ cung cấp LLM (OpenAI, Anthropic, Ollama...) |
| **Tool** | Công cụ | Chức năng mà agent có thể gọi (shell, file, web search...) |
| **Channel** | Kênh | Giao diện I/O (Telegram, Discord, Email, CLI...) |
| **Memory** | Bộ nhớ | Lưu trữ context qua các phiên hội thoại |
| **RAG** | Tạo sinh có truy xuất | Retrieval-Augmented Generation — tìm tài liệu rồi tạo câu trả lời |
| **FTS5** | Tìm kiếm toàn văn | Full-Text Search 5 — SQLite search engine |
| **BM25** | Xếp hạng từ khoá | Thuật toán xếp hạng kết quả tìm kiếm |
| **MCP** | Giao thức ngữ cảnh mô hình | Model Context Protocol — chuẩn kết nối tools |
| **ReAct** | Suy luận-Hành động | Reason-Act-Observe loop — vòng lặp agent |
| **Think-Act-Observe** | Nghĩ-Làm-Quan sát | BizClaw's implementation of ReAct |
| **Quality Gate** | Cổng chất lượng | Evaluator LLM tự review response trước khi trả |
| **Auto-Compaction** | Nén tự động | Summarize context khi đạt 70% → persist to daily log |
| **System Prompt** | Prompt hệ thống | Chỉ thị cố định cho agent (role, rules, format) |
| **Token** | Token | Đơn vị đo lường text cho LLM (~4 chars tiếng Anh) |
| **Trait** | Đặc tính/Giao diện | Rust interface — cho phép plug & play components |
| **Crate** | Module/Gói | Rust package — đơn vị tổ chức code |
| **GGUF** | Định dạng mô hình | Format lưu model quantized cho local inference |
| **SIMD** | | Single Instruction Multiple Data — tăng tốc tính toán |
| **Orchestrator** | Bộ điều phối | Quản lý và phân phối tasks giữa nhiều agent |
| **Multi-Tenant** | Đa thuê bao | 1 platform quản lý nhiều bots/tenants |
| **JWT** | | JSON Web Token — authentication mechanism |
| **Pairing Code** | Mã ghép nối | Code 6 số để kết nối vào tenant gateway |
| **Prompt Caching** | Cache prompt | Cache system prompt → giảm 60-90% input tokens |
| **Webhook** | | HTTP callback — external system gọi BizClaw |
| **Sandbox** | Hộp cát | Môi trường thực thi cách ly, an toàn |
| **Allowlist** | Danh sách cho phép | Chỉ commands trong danh sách mới được chạy |
| **Function Calling** | Gọi hàm | LLM chọn và gọi tool với tham số đúng |
| **Hallucination** | Ảo giác | LLM bịa ra thông tin không có thật |
| **Context Window** | Cửa sổ ngữ cảnh | Giới hạn tokens mà LLM xử lý được (128K, etc.) |
| **Chunking** | Chia nhỏ | Chia tài liệu thành các phần nhỏ để index |
| **Embedding** | Nhúng | Vector representation of text cho semantic search |
| **Brain Workspace** | Không gian não | SOUL.md, MEMORY.md... — loaded mỗi turn |
| **Plan Mode** | Chế độ kế hoạch | Agent tạo kế hoạch → execute từng bước |
