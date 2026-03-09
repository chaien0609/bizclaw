# 📖 Module 14: Dashboard & Agent Management

> **Phase**: 🔧 TOOLSET | **Buổi**: 14/24 | **Thời lượng**: 2 giờ

---

## 🎯 Mục Tiêu: Thành thạo BizClaw Dashboard 15 trang + Agent CRUD

## 📋 Nội Dung

### 1. Dashboard Overview (15 Pages)

| Page | Route | Chức năng |
|------|-------|-----------|
| 📊 Dashboard | `/dashboard` | Server stats, uptime, tools count |
| 💬 Chat | `/chat` | WebSocket real-time chat |
| ⚙️ Settings | `/settings` | Provider, model, system prompt |
| 🔌 Providers | `/providers` | API key management (masked) |
| 📱 Channels | `/channels` | Telegram, Discord, Email, etc. |
| 🛠️ Tools | `/tools` | 13+ built-in tools |
| 🔗 MCP | `/mcp` | MCP server management |
| 🤖 Agents | `/agents` | Multi-agent orchestrator |
| 📚 Knowledge | `/knowledge` | RAG document management |
| 🧠 Brain | `/brain` | Brain Engine + GGUF models |
| 📄 Config | `/configfile` | Raw config.toml viewer |
| 🖼️ Gallery | `/gallery` | 51 agent templates |
| 📊 Traces | `/traces` | LLM tracing & cost tracking |
| 📈 Activity | `/activity` | Activity feed |
| ⏰ Scheduler | `/scheduler` | Scheduled tasks |

### 2. Agent Gallery — 51 Business Templates

Cài agent chuyên biệt **1 click**. 13 categories:

- 🧑‍💼 HR (5): Tuyển dụng, Onboarding, Lương, KPI, Nội quy
- 💰 Sales (5): CRM, Báo giá, Doanh số, Telesales, Đối tác
- 📊 Finance (5): Kế toán, Thuế, Dòng tiền, Hoá đơn, Kiểm soát
- 🏭 Operations (5): Kho, Mua hàng, Vận chuyển, QC, Bảo trì
- ⚖️ Legal (4): Hợp đồng, Tuân thủ, SHTT, Tranh chấp
- 📞 Customer Service (3): CSKH, Ticket, CSAT
- 📣 Marketing (5): Content, SEO, Ads, Social, Thương hiệu
- 🛒 E-commerce (3): Sản phẩm, Đơn hàng, TMĐT
- 💼 Management (5): Họp, Báo cáo, Chiến lược, Dự án, OKR
- 📝 Admin (3): Văn thư, Tài sản, Công tác phí
- 💻 IT (3): Helpdesk, An ninh mạng, Hạ tầng
- 📧 Business (3): Email, Dịch thuật, Phân tích
- 🎓 Training (2): Đào tạo, SOP

### 3. Hands-on Workflow

```
1. Dashboard → Gallery → Chọn "Sales CRM Agent" → Install
2. Settings → Chọn Provider (DeepSeek) → Save
3. Chat → Test: "Tạo báo cáo doanh số tháng 2"
4. Agents → View agent details, edit system prompt
5. Traces → Check cost, latency, quality
```

### 4. WebSocket Chat Interface

- Real-time streaming responses
- Tool execution visible (Think/Act/Observe)
- Bilingual UI (Vietnamese/English toggle)
- Pairing code authentication (VPS mode)

---

## 📝 Lab: Explore Dashboard (45 phút)

1. Navigate all 15 pages
2. Install 3 agent templates from Gallery
3. Chat with each, compare quality
4. Check LLM Traces for cost analysis
5. Schedule 1 recurring task

---

## ⏭️ **Module 15: Communication Channels (Telegram, Discord)**
