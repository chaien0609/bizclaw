# 📖 Module 18: Knowledge RAG & Brain Engine

> **Phase**: 🔧 TOOLSET | **Buổi**: 18/24 | **Thời lượng**: 2 giờ

---

## 🎯 Mục Tiêu: Upload documents, search knowledge, configure Brain Engine

## 📋 Nội Dung

### 1. Knowledge RAG — Hands-on

#### 1.1 Upload Documents

```bash
# Via API
curl -X POST http://localhost:3579/api/v1/knowledge/documents \
  -F "file=@products.pdf" \
  -F "title=Product Catalog 2026"

# Via Dashboard
Dashboard → Knowledge → Upload → Select file → Submit
```

#### 1.2 Search Knowledge

```bash
curl -X POST http://localhost:3579/api/v1/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "chính sách bảo hành", "top_k": 5}'
```

#### 1.3 Auto RAG During Chat

```
User: "Chính sách bảo hành sản phẩm X?"

Agent internally:
  1. Detect question needs knowledge → trigger RAG
  2. Search: "bảo hành sản phẩm X" → FTS5
  3. Found: warranty-policy.pdf chunk 3
  4. Context: "Bảo hành 12 tháng, đổi mới 30 ngày..."
  5. Generate response WITH retrieved context

Agent: "Sản phẩm X được bảo hành 12 tháng tại tất cả chi nhánh.
        Đổi mới trong 30 ngày nếu lỗi nhà sản xuất. 📋"
```

### 2. Brain Engine — Offline GGUF Inference

```
BizClaw Brain Engine:
├── Pure Rust implementation
├── GGUF model format (quantized)
├── SIMD acceleration:
│   ├── ARM NEON (Raspberry Pi)
│   ├── x86 SSE2/AVX2 (VPS/Desktop)
│   └── Apple Silicon (M1/M2/M3)
├── Memory-mapped (mmap) for efficiency
└── No external dependencies (no Python, no ollama)
```

#### 2.1 Setup Brain Engine

```bash
# Download GGUF model
wget https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf

# Configure
# Dashboard → Brain → Model Path → Select downloaded model
# Or in config.toml:
[brain]
enabled = true
model_path = "/root/models/llama-2-7b.Q4_K_M.gguf"
```

#### 2.2 Model Scanning

```
Dashboard → Brain → Scan Models

Scans filesystem for .gguf files:
  /root/models/
  ├── llama-2-7b.Q4_K_M.gguf     (3.8 GB)
  ├── phi-3-mini.Q4_K_M.gguf      (2.3 GB)
  └── qwen-2-7b.Q4_K_M.gguf       (4.1 GB)
```

### 3. Dual-Mode RAG Comparison

| Feature | FTS5/BM25 | PageIndex MCP |
|---------|-----------|---------------|
| Speed | ⚡ < 10ms | 🐌 2-5s |
| Accuracy | ~75% | **98.7%** |
| Cost | FREE | LLM call cost |
| Offline | ✅ Yes | ❌ Needs LLM |
| Setup | Zero config | MCP server |
| Best for | Simple queries | Complex reasoning |

### 4. Knowledge Management Best Practices

1. **Organize by topic**: 1 document per topic, not mega-files
2. **Keep updated**: Remove outdated documents regularly
3. **Test retrieval**: Search 10 common questions, verify quality
4. **Metadata matters**: Good titles → better search results
5. **Chunk size**: 512 tokens default, adjust if needed

---

## 📝 Lab: Build Knowledge Base (45 phút)

1. Create 5 business documents (FAQ, Policy, Products, SOP, Contact)
2. Upload all to Knowledge
3. Test 10 search queries
4. Chat with agent — verify RAG answers
5. Configure Brain Engine with GGUF model (if hardware allows)

---

## ⏭️ **Module 19: Multi-Tenant Platform & Security**
