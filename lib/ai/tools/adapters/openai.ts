/**
 * lib/ai/tools/adapters/openai.ts
 *
 * OpenAI Function Calling Adapter: Translates ToolDefinition to OpenAI schema
 * and parses raw OpenAI tool_calls into unified ToolCallRequest objects.
 */

import type { ToolDefinition, ToolCallRequest, ToolParameterSchema } from "../types";

export interface OpenAIFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface OpenAIToolDeclaration {
  type: "function";
  function: OpenAIFunctionDeclaration;
}

/**
 * Format internal ToolDefinition array into OpenAI function declarations.
 */
export function formatToolsForOpenAI(
  toolDefinitions: ToolDefinition[]
): OpenAIToolDeclaration[] {
  if (!toolDefinitions || toolDefinitions.length === 0) {
    return [];
  }

  return toolDefinitions.map((def) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    if (def.parameters) {
      for (const [propName, propSchema] of Object.entries(def.parameters)) {
        properties[propName] = formatOpenAIParameter(propSchema);
        if (propSchema.required) {
          required.push(propName);
        }
      }
    }

    return {
      type: "function",
      function: {
        name: def.name,
        description: def.description,
        parameters: {
          type: "object",
          properties,
          required: required.length > 0 ? required : undefined,
        },
      },
    };
  });
}

function formatOpenAIParameter(schema: ToolParameterSchema): Record<string, unknown> {
  const param: Record<string, unknown> = {
    type: schema.type,
  };

  if (schema.description) param.description = schema.description;
  if (schema.enum && schema.enum.length > 0) param.enum = schema.enum;

  if (schema.type === "array" && schema.items) {
    param.items = formatOpenAIParameter(schema.items);
  }

  if (schema.type === "object" && schema.properties) {
    const nestedProps: Record<string, unknown> = {};
    const nestedReq: string[] = [];
    for (const [key, val] of Object.entries(schema.properties)) {
      nestedProps[key] = formatOpenAIParameter(val);
      if (val.required) nestedReq.push(key);
    }
    param.properties = nestedProps;
    if (nestedReq.length > 0) param.required = nestedReq;
  }

  return param;
}

/**
 * Parse raw OpenAI completion response or tool_calls array into unified ToolCallRequest[].
 * Guaranteed never to throw an unhandled exception.
 */
export function parseOpenAIToolCalls(response: unknown): ToolCallRequest[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  try {
    const resObj = response as Record<string, unknown>;

    // Support full OpenAI Response object (response.choices[0].message.tool_calls)
    let rawCalls: unknown = undefined;
    if (Array.isArray(resObj.tool_calls)) {
      rawCalls = resObj.tool_calls;
    } else if (Array.isArray(resObj.choices) && resObj.choices.length > 0) {
      const choice = resObj.choices[0] as Record<string, unknown>;
      if (choice.message && typeof choice.message === "object") {
        const msg = choice.message as Record<string, unknown>;
        if (Array.isArray(msg.tool_calls)) {
          rawCalls = msg.tool_calls;
        }
      }
    }

    if (!Array.isArray(rawCalls)) {
      return [];
    }

    const requests: ToolCallRequest[] = [];

    rawCalls.forEach((call, index) => {
      try {
        if (!call || typeof call !== "object") return;
        const callObj = call as Record<string, unknown>;
        const fn = callObj.function as Record<string, unknown> | undefined;

        if (!fn || typeof fn.name !== "string" || fn.name.trim() === "") {
          return;
        }

        let parsedArgs: Record<string, unknown> = {};
        if (typeof fn.arguments === "string") {
          try {
            parsedArgs = JSON.parse(fn.arguments);
          } catch {
            parsedArgs = {};
          }
        } else if (typeof fn.arguments === "object" && fn.arguments !== null) {
          parsedArgs = fn.arguments as Record<string, unknown>;
        }

        const callId =
          typeof callObj.id === "string" && callObj.id.trim() !== ""
            ? callObj.id
            : `call_openai_${index}_${Date.now()}`;

        requests.push({
          callId,
          toolName: fn.name,
          arguments: parsedArgs,
        });
      } catch {
        // Skip malformed item safely
      }
    });

    return requests;
  } catch (err) {
    console.error("[OPENAI TOOL CALL PARSE ERROR]", err);
    return [];
  }
}
