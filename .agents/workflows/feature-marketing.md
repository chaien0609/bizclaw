---
description: Quy trình tạo bài marketing cho tính năng mới — từ code ship xong → viết bài → gen hình → đăng Facebook/LinkedIn
---

# 🚀 Feature Marketing Pipeline

Quy trình **end-to-end** từ khi ship tính năng mới đến khi có bài marketing
chất lượng cao đăng social media. Áp dụng 3 skills: `social-content`, 
`image-prompt-master`, `copywriting`.

---

## Phase 1: Thu thập Context (2 phút)

1. Xem lại git log để biết chính xác tính năng vừa ship:
```bash
git log --oneline -5
```

2. Tóm tắt tính năng theo format:
   - **Tên tính năng:** (ví dụ: "AI Database Connector")
   - **Giải quyết vấn đề gì:** (ví dụ: "Agent tự query database thay vì user viết SQL")
   - **Khác biệt/USP:** (ví dụ: "5 tầng bảo vệ, KHÔNG THỂ xóa data")
   - **Target audience:** (ví dụ: "Micro SaaS founders, indie hackers")
   - **Platform đăng:** Facebook, LinkedIn, Twitter/X

---

## Phase 2: Viết bài theo PAS Formula (5 phút)

Dùng **PAS (Problem → Agitate → Solution)** — công thức copywriting hiệu quả nhất cho tech product:

3. **Problem Hook** — Dòng đầu tiên quyết định 80% engagement:
   - Dùng Story Hook: "Mình vừa ship 1 tính năng mà..."
   - HOẶC Contrarian Hook: "Mọi người đều nói AI nguy hiểm với database. Mình không đồng ý."
   - HOẶC Social Proof Hook: "Sau X ngày build, cuối cùng cũng xong..."

4. **Agitate** — Nêu nỗi sợ/lo ngại của người đọc:
   - "Nhưng khoan — bạn sẽ hỏi: Lỡ AI xóa hết data thì sao?"
   - Dùng emoji 🫣 hoặc 😱 để tăng cảm xúc

5. **Solution** — Show giải pháp với bullet points cụ thể:
   - Liệt kê 3-5 điểm nổi bật với emoji
   - Dùng số cụ thể (max 1000 rows, AES-256, 30s timeout)
   - Kết bằng CTA: "👉 Try: github.com/..."

6. **Viết 2 versions:**
   - Version VN 🇻🇳 cho cộng đồng Việt
   - Version EN 🌍 cho international audience

---

## Phase 3: Tạo Hero Image (3 phút)

7. Dùng `generate_image` tool với prompt theo **5-Layer Framework**:

   **Template prompt cho BizClaw feature (TIẾNG VIỆT):**
   ```
   Professional marketing banner for Vietnamese tech product "BizClaw".
   Dark navy gradient background (#0a1628 to #1a2744).
   Left side: Bold white "BizClaw" title with claw icon,
   "[Tên Tính Năng tiếng Việt]" in large electric cyan,
   Vietnamese tagline "[Mô tả lợi ích 1 dòng]" in light gray,
   [icons + labels], "[Specs tiếng Việt]" in small cyan.
   Right side: Futuristic holographic [feature visualization],
   cyan and purple glow, floating particles.
   Modern SaaS style, 16:9, professional quality, no watermark.
   ```

   ⚠️ **BẮT BUỘC:** Hình PHẢI bằng tiếng Việt (tagline, specs, mô tả).

8. **Checklist hình ảnh:**
   - [ ] Có chữ "BizClaw" rõ ràng
   - [ ] Có tên tính năng **bằng tiếng Việt**
   - [ ] Có tagline mô tả lợi ích **bằng tiếng Việt**
   - [ ] Có minh họa trực quan
   - [ ] Người xem hiểu được sản phẩm KHÔNG cần đọc caption

---

## Phase 4: Đăng bài (2 phút)

9. **Facebook:**
   - Đăng **native** — KHÔNG để link trong bài chính (giảm reach)
   - Upload hình trực tiếp
   - Comment đầu tiên: link GitHub + hashtags
   - Đăng vào **13h-16h weekday** (peak engagement VN)

10. **LinkedIn:**
    - Reformat bài: thêm line breaks, bỏ emoji quá nhiều
    - Dùng personal account (reach cao hơn company page 10x)
    - Đăng vào **7-8h sáng hoặc 17-18h**

11. **Twitter/X:**
    - Tóm gọn thành thread 3-5 tweets
    - Tweet 1: Hook + hình
    - Tweet 2-4: Bullet points tính năng
    - Tweet cuối: CTA + link

---

## Phase 5: Engage & Amplify (30 phút đầu)

// turbo
12. Reply TẤT CẢ comments trong 60 phút đầu — Facebook algorithm ưu tiên bài có engagement sớm

13. Share vào các groups liên quan:
    - AI/ML communities
    - Rust developers
    - Indie hackers / Micro SaaS
    - Vietnam tech communities

14. Cross-post lên:
    - Reddit (r/rust, r/SideProject)
    - Hacker News (Show HN: ...)
    - Dev.to (bài blog dài hơn)

---

## 📌 CTA Footer — BẮT BUỘC thêm vào cuối MỌI bài post

**LUÔN LUÔN** thêm đoạn này vào cuối bài (sau nội dung chính):

```
━━━━━━━━━━━━━━━━━━━
⭐ Tặng mình 1 sao trên GitHub nhé!
Mỗi ngôi sao là động lực để team tiếp tục phát triển open source cho cộng đồng Việt Nam
🗳️ Xin thêm 1 lượt Voted ở đây nha bà con: https://unikorn.vn/p/bizclaw
🐙 GitHub: https://github.com/nguyenduchoai/bizclaw
🌐 Website: https://bizclaw.vn
Comment "⭐" nếu bạn đã star repo!
----------------------------
💬 Comment "AI" bên dưới nếu bạn muốn tôi demo cảnh các Agent "bàn luận" với nhau trong video tới nhé!
```

⚠️ **Quy tắc:** Đoạn CTA footer này PHẢI có trong:
- Mọi bài Facebook/LinkedIn về tính năng mới
- Mọi bài README update
- Mọi content marketing liên quan đến BizClaw

---

## 📋 Quick Checklist

```
[ ] Git log → tóm tắt tính năng
[ ] Viết bài PAS (VN + EN)
[ ] Gen hình TIẾNG VIỆT có BizClaw branding + mô tả tính năng
[ ] Kiểm tra hình: có tên SP? có tagline? có icon? TIẾNG VIỆT?
[ ] Thêm CTA footer (GitHub star + Unikorn vote + Website)
[ ] Facebook: đăng native, link ở comment
[ ] LinkedIn: reformat, đăng personal account
[ ] Reply comments 60 phút đầu
[ ] Share vào groups/communities
```

---

## 🎯 Metrics theo dõi sau 24h

- Impressions / Reach
- Engagement rate (comments > likes > shares)
- Link clicks (từ comment)
- Follower mới
- GitHub stars mới
- Unikorn votes mới
