//! Pre-built workflow templates — ready to use out of the box.

use crate::step::{
    CollectStrategy, Condition, LoopConfig, StepType, Workflow, WorkflowStep,
};

/// Get all built-in workflow templates.
pub fn builtin_workflows() -> Vec<Workflow> {
    vec![
        content_pipeline(),
        expert_consensus(),
        quality_pipeline(),
        research_pipeline(),
        translation_pipeline(),
        code_review_pipeline(),
        slide_creator(),
        // CEO Workflows
        meeting_recap(),
        ceo_daily_briefing(),
        competitor_analysis(),
        proposal_generator(),
        weekly_report(),
    ]
}

/// Content creation pipeline: Draft → Review → Edit → Publish.
pub fn content_pipeline() -> Workflow {
    Workflow::new("content_pipeline", "Content creation pipeline — Draft → Review → Edit → Publish")
        .with_tags(vec!["content", "writing", "marketing"])
        .add_step(
            WorkflowStep::new("draft", "content-writer", StepType::Sequential)
                .with_prompt("Write a comprehensive article about: {{input}}")
                .with_timeout(600)
                .with_retries(1),
        )
        .add_step(
            WorkflowStep::new("review", "content-reviewer", StepType::Sequential)
                .with_prompt("Review this article for quality, accuracy, and engagement. Provide specific feedback and suggested improvements:\n\n{{input}}")
                .with_timeout(300),
        )
        .add_step(
            WorkflowStep::new("edit", "content-editor", StepType::Sequential)
                .with_prompt("Apply the review feedback and create the final polished version of this article:\n\n{{input}}")
                .with_timeout(300),
        )
}

/// Expert consensus: 3 experts analyze independently → vote/merge.
pub fn expert_consensus() -> Workflow {
    Workflow::new("expert_consensus", "Expert consensus — 3 independent analyses merged into one")
        .with_tags(vec!["analysis", "consensus", "decision"])
        .add_step(
            WorkflowStep::new("expert-a", "analyst-a", StepType::Sequential)
                .with_prompt("As Expert A, analyze this independently:\n\n{{input}}"),
        )
        .add_step(
            WorkflowStep::new("expert-b", "analyst-b", StepType::Sequential)
                .with_prompt("As Expert B, analyze this independently:\n\n{{input}}"),
        )
        .add_step(
            WorkflowStep::new("expert-c", "analyst-c", StepType::Sequential)
                .with_prompt("As Expert C, analyze this independently:\n\n{{input}}"),
        )
        .add_step(WorkflowStep::new(
            "parallel-analysis",
            "coordinator",
            StepType::FanOut {
                parallel_steps: vec![
                    "expert-a".into(),
                    "expert-b".into(),
                    "expert-c".into(),
                ],
            },
        ))
        .add_step(WorkflowStep::new(
            "merge",
            "coordinator",
            StepType::Collect {
                strategy: CollectStrategy::Merge,
                evaluator: None,
            },
        ))
}

/// Quality pipeline with evaluate loop: generate → review → revise until approved.
pub fn quality_pipeline() -> Workflow {
    Workflow::new("quality_pipeline", "Quality-gated pipeline — generate and revise until approved")
        .with_tags(vec!["quality", "review", "iterate"])
        .add_step(
            WorkflowStep::new("generate", "writer", StepType::Sequential)
                .with_prompt("Create high-quality content for: {{input}}")
                .with_timeout(600),
        )
        .add_step(WorkflowStep::new(
            "refine",
            "reviewer",
            StepType::Loop {
                body_step: "generate".into(),
                config: LoopConfig::new(
                    3,
                    Condition::new("quality", "contains", "APPROVED"),
                ),
            },
        ))
}

/// Research pipeline: Search → Analyze → Synthesize → Report.
pub fn research_pipeline() -> Workflow {
    Workflow::new("research_pipeline", "Research pipeline — Search → Analyze → Synthesize → Report")
        .with_tags(vec!["research", "analysis", "report"])
        .add_step(
            WorkflowStep::new("search", "researcher", StepType::Sequential)
                .with_prompt("Research the following topic thoroughly. Find key facts, data, and sources:\n\n{{input}}")
                .with_timeout(600),
        )
        .add_step(
            WorkflowStep::new("analyze", "analyst", StepType::Sequential)
                .with_prompt("Analyze the research findings below. Identify patterns, insights, and key takeaways:\n\n{{input}}")
                .with_timeout(300),
        )
        .add_step(
            WorkflowStep::new("synthesize", "synthesizer", StepType::Sequential)
                .with_prompt("Synthesize the analysis into a coherent narrative with conclusions and recommendations:\n\n{{input}}")
                .with_timeout(300),
        )
        .add_step(
            WorkflowStep::new("report", "report-writer", StepType::Sequential)
                .with_prompt("Format the synthesis into a professional report with executive summary, findings, and next steps:\n\n{{input}}")
                .with_timeout(300),
        )
}

/// Translation pipeline with quality check.
pub fn translation_pipeline() -> Workflow {
    Workflow::new("translation_pipeline", "Translation with quality verification")
        .with_tags(vec!["translation", "i18n", "quality"])
        .add_step(
            WorkflowStep::new("translate", "translator", StepType::Sequential)
                .with_prompt("Translate the following text to the target language, maintaining tone and meaning:\n\n{{input}}")
                .with_retries(1),
        )
        .add_step(
            WorkflowStep::new("verify", "translation-reviewer", StepType::Sequential)
                .with_prompt("Review this translation for accuracy, naturalness, and cultural appropriateness. If issues found, provide the corrected version:\n\n{{input}}")
                .optional(),
        )
}

/// Code review pipeline: Analyze → Security check → Style check → Summary.
pub fn code_review_pipeline() -> Workflow {
    Workflow::new("code_review", "Code review pipeline — analyze, security, style, summary")
        .with_tags(vec!["code", "review", "security"])
        .add_step(
            WorkflowStep::new("analyze", "code-analyst", StepType::Sequential)
                .with_prompt("Analyze this code for bugs, logic errors, and potential improvements:\n\n{{input}}")
                .with_timeout(600),
        )
        .add_step(
            WorkflowStep::new("security", "security-expert", StepType::Sequential)
                .with_prompt("Review this code for security vulnerabilities (injection, auth bypass, data exposure):\n\n{{input}}")
                .with_timeout(300),
        )
        .add_step(
            WorkflowStep::new("style", "style-checker", StepType::Sequential)
                .with_prompt("Review this code for style, readability, and best practices:\n\n{{input}}")
                .optional(),
        )
        .add_step(
            WorkflowStep::new(
                "summary",
                "coordinator",
                StepType::Transform {
                    template: "## Code Review Summary\n\n{{input}}".to_string(),
                },
            ),
        )
}/// AI Slide Creator: Research → Plan → Generate (parallel) → Review → Export.
///
/// 4-stage pipeline implementing the full slide creation flow:
/// ① Research: Gather information, save to memory
/// ② Plan: LLM reasoning → structured slide outline with dependencies  
/// ③ Generate: FanOut parallel slide creation + sequential for dependent slides
/// ④ Review & Export: Quality gate loop → merge → PPTX export → notify
pub fn slide_creator() -> Workflow {
    Workflow::new(
        "slide_creator",
        "AI Slide Creator — Nghiên cứu → Lập kế hoạch → Tạo slide song song → Xuất PPTX",
    )
    .with_tags(vec!["slides", "presentation", "pptx", "research", "parallel"])
    .with_timeout(1800) // 30 min max for full pipeline
    // Stage 1: Research — thu thập dữ liệu
    .add_step(
        WorkflowStep::new("research", "researcher", StepType::Sequential)
            .with_prompt(
                "Bạn là chuyên gia nghiên cứu. Nhiệm vụ: nghiên cứu chủ đề sau để chuẩn bị tạo bài thuyết trình.\n\n\
                Chủ đề: {{input}}\n\n\
                Hãy:\n\
                1. Thu thập dữ liệu, số liệu, xu hướng quan trọng\n\
                2. Xác định 5-8 điểm chính cần trình bày\n\
                3. Tìm ví dụ, case study minh hoạ\n\
                4. Ghi lại nguồn tham khảo\n\n\
                Trả về kết quả nghiên cứu chi tiết, có cấu trúc rõ ràng."
            )
            .with_timeout(600)
            .with_retries(1),
    )
    // Stage 2: Plan — lập kế hoạch slide
    .add_step(
        WorkflowStep::new("plan", "planner", StepType::Sequential)
            .with_prompt(
                "Bạn là chuyên gia thiết kế bài thuyết trình. Dựa trên nghiên cứu sau, hãy lập kế hoạch chi tiết cho bài slide.\n\n\
                Nghiên cứu:\n{{input}}\n\n\
                Hãy tạo outline gồm:\n\
                1. Tiêu đề bài thuyết trình\n\
                2. Danh sách slides (10-20 slides), mỗi slide gồm:\n\
                   - Số thứ tự\n\
                   - Tiêu đề slide\n\
                   - Nội dung chính (3-5 bullet points)\n\
                   - Gợi ý hình ảnh/biểu đồ\n\
                   - Loại: cover, content, data, chart, quote, closing\n\
                3. Phân loại slides nào có thể tạo song song (độc lập) vs tuần tự (phụ thuộc)\n\n\
                Format kết quả rõ ràng để AI khác có thể tạo từng slide."
            )
            .with_timeout(300),
    )
    // Stage 3a: Generate slides — parallel FanOut
    .add_step(
        WorkflowStep::new("gen-intro", "slide-designer", StepType::Sequential)
            .with_prompt(
                "Tạo nội dung chi tiết cho SLIDE MỞ ĐẦU (Cover + Giới thiệu) dựa trên plan sau.\n\
                Viết nội dung đầy đủ, chuyên nghiệp cho mỗi slide.\n\n{{input}}"
            )
            .with_timeout(300),
    )
    .add_step(
        WorkflowStep::new("gen-body-a", "slide-designer", StepType::Sequential)
            .with_prompt(
                "Tạo nội dung chi tiết cho NHÓM SLIDE PHẦN 1 (slides 3-6 trong plan) dựa trên plan.\n\
                Viết nội dung đầy đủ, chuyên nghiệp, có số liệu cụ thể.\n\n{{input}}"
            )
            .with_timeout(300),
    )
    .add_step(
        WorkflowStep::new("gen-body-b", "slide-designer", StepType::Sequential)
            .with_prompt(
                "Tạo nội dung chi tiết cho NHÓM SLIDE PHẦN 2 (slides 7-10 trong plan) dựa trên plan.\n\
                Viết nội dung đầy đủ, chuyên nghiệp, có ví dụ minh hoạ.\n\n{{input}}"
            )
            .with_timeout(300),
    )
    .add_step(
        WorkflowStep::new("gen-closing", "slide-designer", StepType::Sequential)
            .with_prompt(
                "Tạo nội dung chi tiết cho SLIDE KẾT LUẬN (Tổng kết + CTA + Q&A) dựa trên plan.\n\
                Viết kết luận mạnh mẽ, có call-to-action rõ ràng.\n\n{{input}}"
            )
            .with_timeout(300),
    )
    // Stage 3b: FanOut — chạy song song 4 nhóm slide
    .add_step(WorkflowStep::new(
        "parallel-gen",
        "orchestrator",
        StepType::FanOut {
            parallel_steps: vec![
                "gen-intro".into(),
                "gen-body-a".into(),
                "gen-body-b".into(),
                "gen-closing".into(),
            ],
        },
    ))
    // Stage 3c: Collect — gom kết quả
    .add_step(WorkflowStep::new(
        "assemble",
        "orchestrator",
        StepType::Collect {
            strategy: CollectStrategy::Merge,
            evaluator: None,
        },
    ))
    // Stage 4a: Quality review loop
    .add_step(WorkflowStep::new(
        "quality-check",
        "quality-reviewer",
        StepType::Loop {
            body_step: "assemble".into(),
            config: LoopConfig::new(
                2, // max 2 revision rounds
                Condition::new("quality", "contains", "APPROVED"),
            ),
        },
    ))
    // Stage 4b: Export — format final output
    .add_step(
        WorkflowStep::new(
            "export",
            "formatter",
            StepType::Transform {
                template: "## 📊 Bài Thuyết Trình Hoàn Chỉnh\n\n\
                    Đã tạo xong! Dưới đây là nội dung đầy đủ của tất cả slides:\n\n\
                    {{input}}\n\n\
                    ---\n\
                    ✅ Workflow: Research → Plan → Generate (Parallel) → Review → Export\n\
                    📁 Sẵn sàng xuất ra PPTX bằng Document Generator skill."
                    .to_string(),
            },
        ),
    )
}

// ═══════════════════════════════════════════════════════════════
// CEO Workflows — Dành cho giám đốc doanh nghiệp SME
// ═══════════════════════════════════════════════════════════════

/// Meeting Recap: Audio/Text → Transcript → Summary → Action Items → Assign Tasks → Notify.
///
/// Input: Meeting notes hoặc transcript (copy/paste hoặc từ audio transcription).
/// Output: Biên bản họp + danh sách task + gửi thông báo đa kênh.
pub fn meeting_recap() -> Workflow {
    Workflow::new(
        "meeting_recap",
        "Meeting Recap — Biên bản họp → Tóm tắt → Tạo task → Gửi thông báo",
    )
    .with_tags(vec!["meeting", "recap", "tasks", "ceo", "management"])
    .with_timeout(900) // 15 min max
    // Step 1: Phân tích & tóm tắt nội dung họp
    .add_step(
        WorkflowStep::new("summarize", "meeting-analyst", StepType::Sequential)
            .with_prompt(
                "Bạn là thư ký hội đồng chuyên nghiệp. Phân tích nội dung cuộc họp sau và tạo biên bản:\n\n\
                Nội dung họp:\n{{input}}\n\n\
                Hãy tạo biên bản gồm:\n\
                1. **Thông tin cuộc họp**: Chủ đề, thời gian, thành phần tham dự (nếu có)\n\
                2. **Tóm tắt nội dung chính** (3-5 điểm)\n\
                3. **Các quyết định đã đưa ra** (liệt kê rõ ràng)\n\
                4. **Vấn đề chưa giải quyết** (nếu có)\n\
                5. **Số liệu/KPI được đề cập** (nếu có)"
            )
            .with_timeout(300)
            .with_retries(1),
    )
    // Step 2: Trích xuất action items & tasks
    .add_step(
        WorkflowStep::new("extract-tasks", "task-manager", StepType::Sequential)
            .with_prompt(
                "Từ biên bản họp sau, hãy trích xuất TẤT CẢ action items thành task list cụ thể:\n\n\
                {{input}}\n\n\
                Format mỗi task:\n\
                - **Task**: [Mô tả công việc]\n\
                - **Người phụ trách**: [Tên/Phòng ban]\n\
                - **Deadline**: [Ngày cụ thể hoặc khoảng thời gian]\n\
                - **Độ ưu tiên**: 🔴 Cao / 🟡 Trung bình / 🟢 Thấp\n\
                - **KPI đo lường**: [Tiêu chí hoàn thành]\n\n\
                Sắp xếp theo độ ưu tiên từ cao → thấp."
            )
            .with_timeout(300),
    )
    // Step 3: Tạo bản tóm tắt gửi team (ngắn gọn, dễ đọc)
    .add_step(
        WorkflowStep::new("team-summary", "communicator", StepType::Sequential)
            .with_prompt(
                "Viết bản tóm tắt cuộc họp ngắn gọn để gửi cho team qua Zalo/Telegram/Email.\n\n\
                Biên bản + Tasks:\n{{input}}\n\n\
                Format gửi team (ngắn gọn, thân thiện):\n\
                📋 **Kết quả họp [Chủ đề]**\n\
                ⏰ [Thời gian]\n\n\
                🎯 **Quyết định chính:**\n\
                • [bullet 1]\n\
                • [bullet 2]\n\n\
                📌 **Task phân công:**\n\
                • @[Tên] → [Task] — Deadline: [ngày]\n\
                • @[Tên] → [Task] — Deadline: [ngày]\n\n\
                ⚠️ **Lưu ý:** [nếu có]\n\n\
                Giữ đúng format, ngắn gọn, dễ đọc trên mobile."
            )
            .with_timeout(300),
    )
    // Step 4: Export format
    .add_step(
        WorkflowStep::new(
            "export",
            "formatter",
            StepType::Transform {
                template: "## 📋 Meeting Recap\n\n{{input}}\n\n---\n\
                    ✅ Auto-generated by BizClaw Meeting Recap Workflow\n\
                    📤 Sẵn sàng gửi qua Zalo / Telegram / Email"
                    .to_string(),
            },
        ),
    )
}

/// Daily CEO Briefing: Tổng hợp tin tức + KPIs + priorities mỗi sáng.
///
/// Chạy tự động lúc 7:00 sáng qua Scheduler.
/// Output: Bản briefing ngắn gọn gửi qua Zalo/Telegram.
pub fn ceo_daily_briefing() -> Workflow {
    Workflow::new(
        "ceo_daily_briefing",
        "CEO Daily Briefing — Tin tức thị trường + KPIs + Ưu tiên hôm nay",
    )
    .with_tags(vec!["ceo", "briefing", "daily", "kpi", "news"])
    .with_timeout(600)
    // Parallel: thu thập 3 nguồn thông tin cùng lúc
    .add_step(
        WorkflowStep::new("market-news", "market-analyst", StepType::Sequential)
            .with_prompt(
                "Thu thập 5 tin tức kinh doanh/thị trường quan trọng nhất hôm nay liên quan đến:\n\
                {{input}}\n\n\
                Mỗi tin gồm: Tiêu đề | Tóm tắt 1 dòng | Tác động đến doanh nghiệp (Tích cực/Tiêu cực/Trung lập)"
            )
            .with_timeout(300),
    )
    .add_step(
        WorkflowStep::new("kpi-check", "data-analyst", StepType::Sequential)
            .with_prompt(
                "Dựa trên ngành nghề sau, liệt kê các KPI quan trọng mà CEO cần theo dõi hàng ngày:\n\
                {{input}}\n\n\
                Format: KPI | Chỉ số mẫu | Xu hướng (↑↓→) | Hành động cần thiết\n\
                Gồm: Doanh thu, Chi phí, Leads, Conversion, Customer complaints, Cash flow"
            )
            .with_timeout(200),
    )
    .add_step(
        WorkflowStep::new("priorities", "strategy-advisor", StepType::Sequential)
            .with_prompt(
                "Dựa trên tin tức và KPIs, đề xuất 3 ưu tiên hàng đầu cho CEO hôm nay:\n\n\
                {{input}}\n\n\
                Format mỗi ưu tiên:\n\
                🎯 **Ưu tiên [N]**: [Tiêu đề]\n\
                - Lý do: [Tại sao quan trọng]\n\
                - Hành động: [Cụ thể cần làm gì]\n\
                - Thời gian: [Bao lâu]"
            )
            .with_timeout(200),
    )
    // FanOut: chạy song song 3 nguồn
    .add_step(WorkflowStep::new(
        "parallel-gather",
        "orchestrator",
        StepType::FanOut {
            parallel_steps: vec![
                "market-news".into(),
                "kpi-check".into(),
                "priorities".into(),
            ],
        },
    ))
    // Collect & merge
    .add_step(WorkflowStep::new(
        "merge",
        "orchestrator",
        StepType::Collect {
            strategy: CollectStrategy::Merge,
            evaluator: None,
        },
    ))
    // Format final briefing
    .add_step(
        WorkflowStep::new(
            "format",
            "formatter",
            StepType::Transform {
                template: "☀️ **CEO DAILY BRIEFING**\n\n{{input}}\n\n---\n\
                    🤖 Auto-generated by BizClaw | Chúc sếp một ngày hiệu quả!"
                    .to_string(),
            },
        ),
    )
}

/// Competitor Analysis: Research → Compare → SWOT → Strategy.
///
/// Input: Tên đối thủ hoặc ngành cần phân tích.
/// Output: Báo cáo phân tích đối thủ chi tiết.
pub fn competitor_analysis() -> Workflow {
    Workflow::new(
        "competitor_analysis",
        "Phân tích đối thủ — Nghiên cứu → So sánh → SWOT → Chiến lược",
    )
    .with_tags(vec!["competitor", "analysis", "strategy", "ceo", "market"])
    .with_timeout(1200)
    // Step 1: Thu thập thông tin đối thủ
    .add_step(
        WorkflowStep::new("research", "market-researcher", StepType::Sequential)
            .with_prompt(
                "Nghiên cứu chi tiết về đối thủ cạnh tranh:\n\n\
                {{input}}\n\n\
                Thu thập:\n\
                1. Thông tin công ty (năm thành lập, quy mô, doanh thu ước tính)\n\
                2. Sản phẩm/dịch vụ chính + Pricing\n\
                3. Điểm mạnh nổi bật\n\
                4. Điểm yếu / Complaints từ khách hàng\n\
                5. Chiến lược marketing (kênh, tần suất, tone)\n\
                6. Công nghệ / Nền tảng sử dụng"
            )
            .with_timeout(600)
            .with_retries(1),
    )
    // Step 2: So sánh & SWOT
    .add_step(
        WorkflowStep::new("compare-swot", "strategy-analyst", StepType::Sequential)
            .with_prompt(
                "Dựa trên nghiên cứu, tạo bảng so sánh và phân tích SWOT:\n\n\
                {{input}}\n\n\
                1. **Bảng so sánh**: [Tiêu chí | Chúng ta | Đối thủ | Ai thắng?]\n\
                   Gồm: Giá, Chất lượng, UX, Marketing, Support, Tech\n\
                2. **SWOT của đối thủ**:\n\
                   - Strengths (Điểm mạnh)\n\
                   - Weaknesses (Điểm yếu)\n\
                   - Opportunities (Cơ hội cho ta)\n\
                   - Threats (Mối đe doạ)"
            )
            .with_timeout(300),
    )
    // Step 3: Chiến lược đề xuất
    .add_step(
        WorkflowStep::new("strategy", "strategy-advisor", StepType::Sequential)
            .with_prompt(
                "Dựa trên phân tích đối thủ, đề xuất chiến lược cạnh tranh:\n\n\
                {{input}}\n\n\
                Đề xuất:\n\
                1. **Quick Wins** (thực hiện ngay, 1-2 tuần):\n\
                2. **Short-term** (1-3 tháng):\n\
                3. **Long-term** (6-12 tháng):\n\
                4. **Differentiation**: Điểm khác biệt nên tập trung\n\
                5. **Pricing strategy**: Nên cạnh tranh giá hay chất lượng?\n\
                6. **Marketing counter**: Cách đáp trả marketing của đối thủ"
            )
            .with_timeout(300),
    )
    // Export
    .add_step(
        WorkflowStep::new(
            "report",
            "formatter",
            StepType::Transform {
                template: "## 🏢 Báo Cáo Phân Tích Đối Thủ\n\n{{input}}\n\n---\n\
                    📊 Auto-generated by BizClaw Competitor Analysis"
                    .to_string(),
            },
        ),
    )
}

/// Proposal Generator: Client brief → Research → Draft → Review → Send.
///
/// Input: Yêu cầu/brief từ khách hàng.
/// Output: Proposal/báo giá chuyên nghiệp.
pub fn proposal_generator() -> Workflow {
    Workflow::new(
        "proposal_generator",
        "Tạo Proposal — Brief KH → Nghiên cứu → Soạn → Duyệt → Gửi",
    )
    .with_tags(vec!["proposal", "sales", "quote", "ceo", "client"])
    .with_timeout(1200)
    // Step 1: Phân tích brief khách hàng
    .add_step(
        WorkflowStep::new("analyze-brief", "sales-analyst", StepType::Sequential)
            .with_prompt(
                "Phân tích yêu cầu/brief từ khách hàng:\n\n\
                {{input}}\n\n\
                Xác định:\n\
                1. Nhu cầu chính của KH\n\
                2. Budget ước tính (nếu đề cập)\n\
                3. Timeline mong muốn\n\
                4. Tiêu chí lựa chọn nhà cung cấp\n\
                5. Pain points / vấn đề đang gặp\n\
                6. Đề xuất giải pháp phù hợp"
            )
            .with_timeout(300),
    )
    // Step 2: Soạn proposal
    .add_step(
        WorkflowStep::new("draft-proposal", "proposal-writer", StepType::Sequential)
            .with_prompt(
                "Soạn proposal chuyên nghiệp dựa trên phân tích sau:\n\n\
                {{input}}\n\n\
                Cấu trúc proposal:\n\
                1. **Executive Summary** (tóm tắt cho CEO đọc nhanh)\n\
                2. **Hiểu biết về nhu cầu** (cho KH thấy ta hiểu họ)\n\
                3. **Giải pháp đề xuất** (chi tiết, rõ ràng)\n\
                4. **Bảng giá** (packages nếu có, so sánh options)\n\
                5. **Timeline triển khai** (milestones)\n\
                6. **Cam kết & SLA**\n\
                7. **Về chúng tôi** (credentials, case studies)\n\
                8. **Bước tiếp theo** (CTA rõ ràng)\n\n\
                Tone: Chuyên nghiệp, tự tin, hướng đến giải quyết vấn đề."
            )
            .with_timeout(600)
            .with_retries(1),
    )
    // Step 3: Review quality
    .add_step(WorkflowStep::new(
        "quality-gate",
        "reviewer",
        StepType::Loop {
            body_step: "draft-proposal".into(),
            config: LoopConfig::new(
                2,
                Condition::new("quality", "contains", "APPROVED"),
            ),
        },
    ))
    // Step 4: Format final
    .add_step(
        WorkflowStep::new(
            "finalize",
            "formatter",
            StepType::Transform {
                template: "## 📄 Proposal\n\n{{input}}\n\n---\n\
                    ✅ Ready to send | Auto-generated by BizClaw"
                    .to_string(),
            },
        ),
    )
}

/// Weekly Report: Collect → Synthesize → Format → Distribute.
///
/// Input: Tên công ty/phòng ban cần tổng hợp.
/// Output: Báo cáo tuần gửi qua đa kênh.
pub fn weekly_report() -> Workflow {
    Workflow::new(
        "weekly_report",
        "Báo Cáo Tuần — Thu thập → Tổng hợp → Format → Phân phối",
    )
    .with_tags(vec!["report", "weekly", "kpi", "ceo", "management"])
    .with_timeout(900)
    // Parallel: thu thập báo cáo từ nhiều góc
    .add_step(
        WorkflowStep::new("sales-report", "sales-analyst", StepType::Sequential)
            .with_prompt(
                "Tạo phần BÁO CÁO KINH DOANH trong tuần cho:\n\n\
                {{input}}\n\n\
                Gồm: Doanh thu tuần, So sánh tuần trước, Top deals, Pipeline, Dự báo tháng"
            )
            .with_timeout(200),
    )
    .add_step(
        WorkflowStep::new("ops-report", "ops-analyst", StepType::Sequential)
            .with_prompt(
                "Tạo phần BÁO CÁO VẬN HÀNH trong tuần cho:\n\n\
                {{input}}\n\n\
                Gồm: Tiến độ dự án, Issues phát sinh, Resource utilization, Customer incidents"
            )
            .with_timeout(200),
    )
    .add_step(
        WorkflowStep::new("finance-report", "finance-analyst", StepType::Sequential)
            .with_prompt(
                "Tạo phần BÁO CÁO TÀI CHÍNH trong tuần cho:\n\n\
                {{input}}\n\n\
                Gồm: Cash flow, Chi phí, Accounts receivable, Budget vs Actual, Highlights"
            )
            .with_timeout(200),
    )
    // FanOut parallel
    .add_step(WorkflowStep::new(
        "parallel-collect",
        "orchestrator",
        StepType::FanOut {
            parallel_steps: vec![
                "sales-report".into(),
                "ops-report".into(),
                "finance-report".into(),
            ],
        },
    ))
    // Collect & merge
    .add_step(WorkflowStep::new(
        "merge",
        "orchestrator",
        StepType::Collect {
            strategy: CollectStrategy::Merge,
            evaluator: None,
        },
    ))
    // Synthesize: CEO executive summary
    .add_step(
        WorkflowStep::new("executive-summary", "ceo-advisor", StepType::Sequential)
            .with_prompt(
                "Từ báo cáo các phòng ban, viết EXECUTIVE SUMMARY cho CEO:\n\n\
                {{input}}\n\n\
                Format:\n\
                📊 **WEEKLY EXECUTIVE SUMMARY**\n\n\
                🟢 **Highlights** (3 điểm tốt nhất tuần)\n\
                🔴 **Concerns** (2-3 vấn đề cần chú ý)\n\
                🎯 **Focus tuần tới** (3 ưu tiên)\n\
                📈 **KPIs**: [bảng KPI ngắn gọn]\n\n\
                Ngắn gọn, đi thẳng vào vấn đề, CEO đọc trong 2 phút."
            )
            .with_timeout(300),
    )
    // Export
    .add_step(
        WorkflowStep::new(
            "export",
            "formatter",
            StepType::Transform {
                template: "## 📊 Báo Cáo Tuần\n\n{{input}}\n\n---\n\
                    🤖 Auto-generated by BizClaw Weekly Report Workflow"
                    .to_string(),
            },
        ),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_builtin_workflows_count() {
        let workflows = builtin_workflows();
        assert_eq!(workflows.len(), 12);
    }

    #[test]
    fn test_content_pipeline_structure() {
        let wf = content_pipeline();
        assert_eq!(wf.name, "content_pipeline");
        assert_eq!(wf.step_count(), 3);
        assert!(wf.get_step("draft").is_some());
        assert!(wf.get_step("review").is_some());
        assert!(wf.get_step("edit").is_some());
    }

    #[test]
    fn test_expert_consensus_structure() {
        let wf = expert_consensus();
        assert_eq!(wf.name, "expert_consensus");
        assert!(wf.step_count() >= 4);
    }

    #[test]
    fn test_code_review_has_optional() {
        let wf = code_review_pipeline();
        let style_step = wf.get_step("style").unwrap();
        assert!(style_step.optional);
    }

    #[test]
    fn test_all_workflows_have_tags() {
        for wf in builtin_workflows() {
            assert!(!wf.tags.is_empty(), "Workflow '{}' has no tags", wf.name);
        }
    }

    #[test]
    fn test_slide_creator_structure() {
        let wf = slide_creator();
        assert_eq!(wf.name, "slide_creator");
        assert!(wf.step_count() >= 10);
        assert!(wf.get_step("research").is_some());
        assert!(wf.get_step("plan").is_some());
        assert!(wf.get_step("parallel-gen").is_some());
        assert!(wf.get_step("assemble").is_some());
        assert!(wf.get_step("quality-check").is_some());
        assert!(wf.get_step("export").is_some());
    }

    #[test]
    fn test_meeting_recap_structure() {
        let wf = meeting_recap();
        assert_eq!(wf.name, "meeting_recap");
        assert!(wf.step_count() >= 4);
        assert!(wf.get_step("summarize").is_some());
        assert!(wf.get_step("extract-tasks").is_some());
        assert!(wf.get_step("team-summary").is_some());
        assert!(wf.get_step("export").is_some());
    }

    #[test]
    fn test_ceo_daily_briefing_structure() {
        let wf = ceo_daily_briefing();
        assert_eq!(wf.name, "ceo_daily_briefing");
        assert!(wf.step_count() >= 6);
        assert!(wf.get_step("market-news").is_some());
        assert!(wf.get_step("kpi-check").is_some());
        assert!(wf.get_step("priorities").is_some());
        assert!(wf.get_step("parallel-gather").is_some());
    }

    #[test]
    fn test_competitor_analysis_structure() {
        let wf = competitor_analysis();
        assert_eq!(wf.name, "competitor_analysis");
        assert!(wf.step_count() >= 4);
        assert!(wf.get_step("research").is_some());
        assert!(wf.get_step("compare-swot").is_some());
        assert!(wf.get_step("strategy").is_some());
    }

    #[test]
    fn test_proposal_generator_structure() {
        let wf = proposal_generator();
        assert_eq!(wf.name, "proposal_generator");
        assert!(wf.step_count() >= 4);
        assert!(wf.get_step("analyze-brief").is_some());
        assert!(wf.get_step("draft-proposal").is_some());
    }

    #[test]
    fn test_weekly_report_structure() {
        let wf = weekly_report();
        assert_eq!(wf.name, "weekly_report");
        assert!(wf.step_count() >= 7);
        assert!(wf.get_step("sales-report").is_some());
        assert!(wf.get_step("ops-report").is_some());
        assert!(wf.get_step("finance-report").is_some());
        assert!(wf.get_step("executive-summary").is_some());
    }
}
