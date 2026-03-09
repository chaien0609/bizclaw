# 📖 Module 06: RAG — Retrieval-Augmented Generation

> **Phase**: 🛠️ SKILLSET  
> **Buổi**: 6/24  
> **Thời lượng**: 2 giờ  
> **Skills tham chiếu**: `rag-engineer`, `rag-implementation`, `llm-app-patterns`

---

## 🎯 Mục Tiêu Học Tập

Sau buổi này, học viên sẽ:
- [ ] Hiểu RAG pipeline: Ingest → Retrieve → Generate
- [ ] Phân biệt FTS5/BM25 và Vector Search
- [ ] Nắm vững chunking strategies
- [ ] Thiết kế Knowledge Base cho BizClaw agent

---

## 📋 Nội Dung

### 1. RAG — Tại Sao Và Khi Nào?

**Vấn đề:** LLM chỉ biết kiến thức training. Không biết dữ liệu riêng của doanh nghiệp.

```
User: "Chính sách bảo hành sản phẩm ABC là gì?"
LLM:  "Tôi không có thông tin cụ thể về sản phẩm ABC." ← FAIL

RAG:  1. Search knowledge base → tìm "bao-hanh-ABC.pdf"
      2. Retrieve relevant chunks → "Bảo hành 12 tháng..."
      3. Generate response with context
      "Sản phẩm ABC được bảo hành 12 tháng tại tất cả chi nhánh." ← WIN
```

### 2. RAG Pipeline Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   INGEST     │───▶│   RETRIEVE   │───▶│   GENERATE   │
│  Documents   │    │   Context    │    │   Response   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       ▼                   ▼                   ▼
  ┌─────────┐       ┌───────────┐       ┌───────────┐
  │ Chunking│       │   FTS5    │       │    LLM    │
  │+Indexing│       │  Search   │       │ + Context │
  └─────────┘       └───────────┘       └───────────┘
```

### 3. BizClaw Knowledge RAG — Dual Mode

| Mode | Technology | Speed | Accuracy | Use Case |
|------|-----------|-------|----------|----------|
| **FTS5/BM25** | SQLite Full-Text Search | ⚡ Instant (< 10ms) | ~75% | Keyword queries |
| **PageIndex MCP** | Reasoning-based RAG | 🐌 Slower (2-5s) | **98.7%** | Complex questions |

#### 3.1 FTS5/BM25 (BizClaw Default)

```
How it works:
1. Document → chunk into paragraphs
2. Index keywords with SQLite FTS5
3. User query → BM25 ranking → top-K chunks
4. Chunks → LLM context → response

Pros: Fast, no API cost, offline
Cons: Keyword-dependent, no semantic understanding
```

#### 3.2 PageIndex MCP (98.7% Accuracy)

```
How it works:
1. Document → tree structure (page index)
2. LLM reasons through tree to find relevant pages
3. Deep reading of relevant pages
4. Context → response

Pros: Near-human accuracy, understands nuance
Cons: Slower, requires LLM calls for retrieval
```

### 4. Chunking Strategies — Chia Tài Liệu Đúng Cách

| Strategy | Mô tả | Khi nào dùng |
|----------|--------|-------------|
| **Fixed-size** | Cắt mỗi 512 tokens | Simple, fast, nhưng cắt giữa câu |
| **Semantic** | Cắt theo paragraphs/sections | Giữ nguyên ý nghĩa |
| **Recursive** | Thử `\n\n` → `\n` → `. ` → ` ` | Best general-purpose |
| **Document-aware** | Theo cấu trúc (headers, lists) | PDF/DOCX có structure |

**BizClaw Recommendation:**
```
CHUNK_CONFIG = {
    chunk_size: 512,       // tokens
    chunk_overlap: 50,     // overlap giữa chunks
    separators: ["\n\n", "\n", ". ", " "],
    preserve_headers: true  // giữ heading context
}
```

### 5. Retrieval Strategies

#### 5.1 Basic Keyword Search
```sql
-- BizClaw FTS5
SELECT content, rank FROM documents 
WHERE documents MATCH 'bảo hành iPhone'
ORDER BY rank LIMIT 5;
```

#### 5.2 Hybrid Search (BM25 + Semantic)
```
1. BM25 keyword search → top 20 candidates
2. Rerank by relevance to query
3. Return top 5 most relevant chunks
```

#### 5.3 Multi-Query Retrieval
```
Original query: "Chính sách đổi trả"
Generated variations:
  - "return policy"
  - "hoàn tiền"
  - "đổi hàng trong bao lâu"
→ Search all 3 → merge results → deduplicate
```

### 6. BizClaw Knowledge Management

#### 6.1 API Endpoints

```
POST /api/v1/knowledge/documents   → Upload document
GET  /api/v1/knowledge/documents   → List all documents
DELETE /api/v1/knowledge/documents/12 → Remove document
POST /api/v1/knowledge/search      → Search knowledge base
```

#### 6.2 Supported Formats

| Format | Reader | Notes |
|--------|--------|-------|
| PDF | `document_reader.rs` | Offline extraction |
| DOCX | `document_reader.rs` | Offline extraction |
| XLSX/CSV | `document_reader.rs` | Tabular data |
| TXT/MD | Direct read | Markdown preserved |

---

## 📝 Bài Tập

### Bài 1: Xây dựng Knowledge Base (30 phút)

Tạo 5 documents cho agent "CSKH Điện tử":
1. FAQ sản phẩm (txt)
2. Chính sách bảo hành (md)  
3. Bảng giá (csv)
4. Hướng dẫn sử dụng (md)
5. Quy trình khiếu nại (md)

### Bài 2: Test Retrieval Quality (20 phút)

Viết 10 câu hỏi test và expected answers. Đánh giá:
- Retrieval hit rate (tìm được chunk đúng?)
- Answer quality (LLM trả lời đúng từ chunk?)

---

## ⏭️ Buổi Tiếp Theo

**Module 07: Tool Design & Function Calling**
