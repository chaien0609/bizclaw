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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_builtin_workflows_count() {
        let workflows = builtin_workflows();
        assert_eq!(workflows.len(), 7);
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
        // Should have: research, plan, gen-intro, gen-body-a, gen-body-b, gen-closing,
        //              parallel-gen, assemble, quality-check, export = 10 steps
        assert!(wf.step_count() >= 10);
        assert!(wf.get_step("research").is_some());
        assert!(wf.get_step("plan").is_some());
        assert!(wf.get_step("parallel-gen").is_some());
        assert!(wf.get_step("assemble").is_some());
        assert!(wf.get_step("quality-check").is_some());
        assert!(wf.get_step("export").is_some());
    }
}
