/**
 * services/qa-engine/validators/schema.ts
 *
 * 7. Schema Markup Validator
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateSchema(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const schemas = input.schemas || [];

  if (schemas.length === 0) {
    score -= 30;
    findings.push("No JSON-LD structured schemas provided");
    recommendations.push("Include structured JSON-LD schemas (Article, FAQPage, or Product)");
  } else {
    findings.push(`Structured JSON-LD schema array contains ${schemas.length} schema(s)`);

    const validSchemas = schemas.filter((s) => s["@context"] && s["@type"]);
    if (validSchemas.length < schemas.length) {
      score -= 20;
      findings.push("Invalid JSON-LD schema structure: missing @context or @type properties");
      recommendations.push("Ensure all schema objects include standard schema.org @context and @type");
    }
  }

  return {
    validatorId: "schema",
    name: "Schema Markup Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
