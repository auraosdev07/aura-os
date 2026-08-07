/**
 * services/qa-engine/validators/seo.ts
 *
 * 4. SEO Optimization Validator
 * Evaluates Keyword placement, Keyword Stuffing, Heading Structure, Slug, Meta Title & Description length.
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateSEO(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const kw = (input.keyword || "").toLowerCase();
  const title = (input.title || "").toLowerCase();
  const metaTitle = (input.metaTitle || input.title || "").toLowerCase();
  const metaDesc = input.metaDescription || "";
  const slug = input.slug || "";

  const fullText = [
    input.title,
    input.content,
    input.shortDescription,
    input.longDescription,
    ...(input.sections || []).map((s) => `${s.heading} ${s.content}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // 1. Keyword in Title / Meta Title
  if (kw && !title.includes(kw) && !metaTitle.includes(kw)) {
    score -= 20;
    findings.push(`Target keyword "${kw}" missing from Title and Meta Title`);
    recommendations.push(`Include target keyword "${kw}" near the beginning of the title`);
  } else if (kw) {
    findings.push(`Target keyword "${kw}" present in Title`);
  }

  // 2. Keyword Density / Stuffing Check
  if (kw) {
    const kwRegex = new RegExp(kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
    const count = (fullText.match(kwRegex) || []).length;
    const totalWords = fullText.split(/\s+/).length || 1;
    const density = (count / totalWords) * 100;

    if (density > 3.5) {
      score -= 25;
      findings.push(`Keyword stuffing detected: "${kw}" appears ${count} times (${density.toFixed(2)}% density)`);
      recommendations.push(`Reduce keyword occurrences of "${kw}" to keep density below 2.5%`);
    } else if (count === 0) {
      score -= 15;
      findings.push(`Target keyword "${kw}" missing from body content`);
      recommendations.push(`Naturally weave target keyword "${kw}" into section paragraphs`);
    } else {
      findings.push(`Healthy keyword density: ${density.toFixed(2)}% (${count} occurrences)`);
    }
  }

  // 3. Meta Title Length (50-60 chars)
  if (metaTitle.length < 30 || metaTitle.length > 65) {
    score -= 10;
    findings.push(`Meta Title length (${metaTitle.length} chars) outside optimal range (50-60 chars)`);
    recommendations.push("Adjust Meta Title to 50-60 characters for maximum search visibility");
  } else {
    findings.push(`Optimal Meta Title length (${metaTitle.length} chars)`);
  }

  // 4. Meta Description Length (120-160 chars)
  if (metaDesc.length < 100 || metaDesc.length > 165) {
    score -= 10;
    findings.push(`Meta Description length (${metaDesc.length} chars) outside optimal range (120-160 chars)`);
    recommendations.push("Adjust Meta Description length to 120-160 characters");
  } else {
    findings.push(`Optimal Meta Description length (${metaDesc.length} chars)`);
  }

  // 5. Slug Check
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    score -= 10;
    findings.push(`URL Slug contains invalid characters: "${slug}"`);
    recommendations.push("Format URL slug to lowercase alphanumeric characters separated by hyphens");
  }

  return {
    validatorId: "seo",
    name: "SEO Optimization Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
