/**
 * services/publishing/providers/markdown-export.ts
 */

import type { PublishingProvider, PublishContentPayload, PublishResult } from "../provider-interface";

export class MarkdownExportProvider implements PublishingProvider {
  id = "markdown-export";
  name = "Markdown Document Export";
  type = "FILE_EXPORT" as const;

  isEnabled(): boolean {
    return true;
  }

  async publish(payload: PublishContentPayload, humanApprover: string): Promise<PublishResult> {
    const markdown = `# ${payload.title}

> Meta Title: ${payload.metaTitle}
> Meta Description: ${payload.metaDescription}
> URL Slug: /articles/${payload.slug}
> Published By: ${humanApprover}

${payload.introduction}

${payload.sections.map((s) => `## ${s.heading}\n\n${s.content}`).join("\n\n")}

### Frequently Asked Questions
${payload.faq.map((f) => `**Q: ${f.question}**\n${f.answer}`).join("\n\n")}
`;

    return {
      success: true,
      publishedUrl: `file:///exports/${payload.slug}.md`,
      publishedId: `md_${payload.slug}_${Date.now()}`,
      exportedContent: markdown,
    };
  }
}
