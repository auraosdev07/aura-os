/**
 * services/website-sync/types.ts
 *
 * Type contracts for Phase 5.2 Website Sync Engine.
 */

export type ResourceType = "PRODUCT" | "BLOG" | "SEO_METADATA" | "SCHEMA";

export interface SyncDiffField {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  status: "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";
}

export interface PreviewResult {
  resourceType: ResourceType;
  resourceId: string;
  hasManualEdits: boolean;
  manualEditWarning?: string;
  diffs: SyncDiffField[];
  changedCount: number;
}

export interface SyncValidationReport {
  isValid: boolean;
  editorialApproved: boolean;
  checksPassed: string[];
  errors: string[];
  warnings: string[];
}

export interface SyncResult {
  success: boolean;
  jobId: string;
  resourceType: ResourceType;
  resourceId: string;
  previousVersion: number;
  newVersion: number;
  updatedFields: string[];
  snapshotId?: string;
  errorMessage?: string;
}

export interface RollbackResult {
  success: boolean;
  resourceType: ResourceType;
  resourceId: string;
  restoredVersion: number;
  snapshotId: string;
  errorMessage?: string;
}
