/**
 * lib/ai/tools/adapters/gemini.ts
 *
 * Gemini Function Calling Adapter: Translates ToolDefinition to Gemini functionDeclarations
 * and parses raw Gemini functionCall parts into unified ToolCallRequest objects.
 */

import type { ToolDefinition, ToolCallRequest, ToolParameterSchema } from "../types";

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "OBJECT";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface GeminiToolDeclaration {
  functionDeclarations: GeminiFunctionDeclaration[];
}

/**
 * Format internal ToolDefinition array into Gemini functionDeclarations schema.
 */
export function formatToolsForGemini(
  toolDefinitions: ToolDefinition[]
): GeminiToolDeclaration[] {
  if (!toolDefinitions || toolDefinitions.length === 0) {
    return [];
  }

  const declarations: GeminiFunctionDeclaration[] = toolDefinitions.map((def) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    if (def.parameters) {
      for (const [propName, propSchema] of Object.entries(def.parameters)) {
        properties[propName] = formatGeminiParameter(propSchema);
        if (propSchema.required) {
          required.push(propName);
        }
      }
    }

    return {
      name: def.name,
      description: def.description,
      parameters: {
        type: "OBJECT",
        properties,
        required: required.length > 0 ? required : undefined,
      },
    };
  });

  return [{ functionDeclarations: declarations }];
}

function formatGeminiParameter(schema: ToolParameterSchema): Record<string, unknown> {
  const param: Record<string, unknown> = {
    type: mapTypeToGemini(schema.type),
  };

  if (schema.description) param.description = schema.description;
  if (schema.enum && schema.enum.length > 0) param.enum = schema.enum;

  if (schema.type === "array" && schema.items) {
    param.items = formatGeminiParameter(schema.items);
  }

  if (schema.type === "object" && schema.properties) {
    const nestedProps: Record<string, unknown> = {};
    const nestedReq: string[] = [];
    for (const [key, val] of Object.entries(schema.properties)) {
      nestedProps[key] = formatGeminiParameter(val);
      if (val.required) nestedReq.push(key);
    }
    param.properties = nestedProps;
    if (nestedReq.length > 0) param.required = nestedReq;
  }

  return param;
}

function mapTypeToGemini(type: string): string {
  switch (type) {
    case "string":
      return "STRING";
    case "number":
      return "NUMBER";
    case "boolean":
      return "BOOLEAN";
    case "array":
      return "ARRAY";
    case "object":
    default:
      return "OBJECT";
  }
}

/**
 * Parse raw Gemini completion response or functionCall parts into unified ToolCallRequest[].
 * Guaranteed never to throw an unhandled exception.
 */
export function parseGeminiToolCalls(response: unknown): ToolCallRequest[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  try {
    const resObj = response as Record<string, unknown>;
    const requests: ToolCallRequest[] = [];

    // Support candidate content parts structure (candidates[0].content.parts)
    let parts: unknown[] = [];

    if (Array.isArray(resObj.functionCalls)) {
      // Direct functionCalls array
      resObj.functionCalls.forEach((call, index) => {
        if (!call || typeof call !== "object") return;
        const callObj = call as Record<string, unknown>;
        if (typeof callObj.name === "string" && callObj.name.trim() !== "") {
          requests.push({
            callId: `call_gemini_${index}_${Date.now()}`,
            toolName: callObj.name,
            arguments: (callObj.args as Record<string, unknown>) || {},
          });
        }
      });
      return requests;
    }

    if (Array.isArray(resObj.candidates) && resObj.candidates.length > 0) {
      const candidate = resObj.candidates[0] as Record<string, unknown>;
      if (candidate.content && typeof candidate.content === "object") {
        const content = candidate.content as Record<string, unknown>;
        if (Array.isArray(content.parts)) {
          parts = content.parts;
        }
      }
    }

    parts.forEach((part, index) => {
      try {
        if (!part || typeof part !== "object") return;
        const partObj = part as Record<string, unknown>;
        const fnCall = partObj.functionCall as Record<string, unknown> | undefined;

        if (fnCall && typeof fnCall.name === "string" && fnCall.name.trim() !== "") {
          const args = (fnCall.args as Record<string, unknown>) || {};
          requests.push({
            callId: `call_gemini_${index}_${Date.now()}`,
            toolName: fnCall.name,
            arguments: args,
          });
        }
      } catch {
        // Skip malformed item safely
      }
    });

    return requests;
  } catch (err) {
    console.error("[GEMINI TOOL CALL PARSE ERROR]", err);
    return [];
  }
}
