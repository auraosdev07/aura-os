/**
 * lib/ai/tools/validator.ts
 *
 * Provider-agnostic JSON-schema argument validator for AI Tools.
 */

import type { ToolParameterSchema, ToolDefinition } from "./types";

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorItem[];
}

/**
 * Validate incoming tool arguments against the JSON Schema defined in ToolDefinition.
 */
export function validateToolArguments(
  definition: ToolDefinition,
  args: Record<string, unknown>
): ValidationResult {
  const errors: ValidationErrorItem[] = [];
  const schemaProps = definition.parameters || {};

  for (const [propName, propSchema] of Object.entries(schemaProps)) {
    const value = args[propName];

    if (propSchema.required && (value === undefined || value === null || value === "")) {
      errors.push({
        field: propName,
        message: `Missing required parameter '${propName}'.`,
      });
      continue;
    }

    if (value !== undefined && value !== null) {
      validateValue(propName, value, propSchema, errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateValue(
  fieldPath: string,
  value: unknown,
  schema: ToolParameterSchema,
  errors: ValidationErrorItem[]
): void {
  // Primitive & complex type validation
  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        errors.push({ field: fieldPath, message: `Expected string for '${fieldPath}', received ${typeof value}.` });
        return;
      }
      break;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push({ field: fieldPath, message: `Expected number for '${fieldPath}', received ${typeof value}.` });
        return;
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") {
        errors.push({ field: fieldPath, message: `Expected boolean for '${fieldPath}', received ${typeof value}.` });
        return;
      }
      break;
    case "array":
      if (!Array.isArray(value)) {
        errors.push({ field: fieldPath, message: `Expected array for '${fieldPath}', received ${typeof value}.` });
        return;
      }
      if (schema.items) {
        value.forEach((item, idx) => {
          validateValue(`${fieldPath}[${idx}]`, item, schema.items!, errors);
        });
      }
      break;
    case "object":
      if (typeof value !== "object" || Array.isArray(value) || value === null) {
        errors.push({ field: fieldPath, message: `Expected object for '${fieldPath}', received ${typeof value}.` });
        return;
      }
      if (schema.properties) {
        const objVal = value as Record<string, unknown>;
        for (const [nestedName, nestedSchema] of Object.entries(schema.properties)) {
          const nestedVal = objVal[nestedName];
          if (nestedSchema.required && (nestedVal === undefined || nestedVal === null)) {
            errors.push({
              field: `${fieldPath}.${nestedName}`,
              message: `Missing required property '${nestedName}' inside '${fieldPath}'.`,
            });
          } else if (nestedVal !== undefined && nestedVal !== null) {
            validateValue(`${fieldPath}.${nestedName}`, nestedVal, nestedSchema, errors);
          }
        }
      }
      break;
  }

  // Enum validation
  if (schema.enum && schema.enum.length > 0) {
    if (!schema.enum.includes(String(value))) {
      errors.push({
        field: fieldPath,
        message: `Value '${value}' for '${fieldPath}' is not allowed. Allowed values: ${schema.enum.join(", ")}.`,
      });
    }
  }
}
