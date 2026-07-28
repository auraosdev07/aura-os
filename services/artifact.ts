"use server";

"use server";

import { getServerContext } from "@/lib/auth/get-server-context";
import {
  getArtifacts as getArtifactsQuery,
  getArtifactById,
  type ArtifactFilters,
  type ArtifactRowWithRelations
} from "@/lib/db/queries";
import {
  createArtifact as createArtifactMutation,
  updateArtifact as updateArtifactMutation,
  softDeleteArtifact,
  restoreArtifact as restoreArtifactMutation,
  hardDeleteArtifact
} from "@/lib/db/mutations";
import type { ArtifactInsert, ArtifactUpdate } from "@/types/database";

export interface ArtifactView {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  checksum: string | null;
  missionId: string | null;
  employeeId: string | null;
  knowledgeId: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Resolved names
  missionName: string | null;
  employeeName: string | null;
  knowledgeTitle: string | null;

  // Derived
  publicUrl: string;

  // Future Extensibility Placeholders
  aiSummary: string | null;
  embeddingStatus: string | null;
  ocrStatus: string | null;
}

const BUCKET_NAME = "artifacts";

function mapArtifact(row: ArtifactRowWithRelations, publicUrl: string): ArtifactView {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    checksum: row.checksum,
    missionId: row.mission_id,
    employeeId: row.employee_id,
    knowledgeId: row.knowledge_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    
    // Extracted relationships
    missionName: row.mission?.title ?? null,
    employeeName: row.employee?.name ?? null,
    knowledgeTitle: row.knowledge?.title ?? null,

    publicUrl,

    // Placeholders
    aiSummary: null,
    embeddingStatus: null,
    ocrStatus: null,
  };
}

export async function getArtifacts(filters?: ArtifactFilters): Promise<ArtifactView[]> {
  const { supabase, user } = await getServerContext();

  const rows = await getArtifactsQuery(supabase, user.id, filters);
  
  return rows.map((row) => {
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(row.storage_path);
    return mapArtifact(row, publicUrlData.publicUrl);
  });
}

export async function getArtifact(id: string): Promise<ArtifactView | null> {
  const { supabase, user } = await getServerContext();

  const row = await getArtifactById(supabase, id, user.id);
  if (!row) return null;

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(row.storage_path);
  return mapArtifact(row, publicUrlData.publicUrl);
}

export interface UploadArtifactPayload {
  file: File;
  name?: string;
  mission_id?: string | null;
  employee_id?: string | null;
  knowledge_id?: string | null;
  checksum?: string | null;
}

export async function createArtifact(payload: UploadArtifactPayload): Promise<ArtifactView> {
  const { supabase, user } = await getServerContext();

  // Validate file
  if (!payload.file) throw new Error("File is required");

  // Format storage path: {owner_id}/{mission_id_or_global}/{filename}_{timestamp}
  const folder = payload.mission_id || payload.employee_id || payload.knowledge_id || "global";
  const uniqueSuffix = Date.now().toString();
  // Safe filename
  const safeFileName = payload.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${user.id}/${folder}/${uniqueSuffix}_${safeFileName}`;

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, payload.file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Insert DB Row (Safe Transaction)
  try {
    const insertData: ArtifactInsert = {
      name: payload.name || payload.file.name,
      storage_path: storagePath,
      mime_type: payload.file.type || "application/octet-stream",
      size_bytes: payload.file.size,
      checksum: payload.checksum || null,
      mission_id: payload.mission_id || null,
      employee_id: payload.employee_id || null,
      knowledge_id: payload.knowledge_id || null,
      owner_id: user.id
    };

    const row = await createArtifactMutation(supabase, insertData);
    
    // We need to fetch it again to get the relations for the view, 
    // or just construct a mock view since we know it has no relations resolved yet.
    // Fetching again is safer to ensure it matches the exact view shape.
    const resolvedRow = await getArtifactById(supabase, row.id, user.id);
    if (!resolvedRow) throw new Error("Failed to retrieve created artifact");

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    return mapArtifact(resolvedRow, publicUrlData.publicUrl);
  } catch (dbError: unknown) {
    const err = dbError as Error;
    // 3. Rollback Storage Upload on DB failure
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error(`Database insert failed, upload rolled back. Error: ${err.message}`);
  }
}

export async function updateArtifact(id: string, data: ArtifactUpdate): Promise<void> {
  const { supabase, user } = await getServerContext();

  await updateArtifactMutation(supabase, id, user.id, data);
}

export async function archiveArtifact(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();

  await softDeleteArtifact(supabase, id, user.id);
}

export async function restoreArtifact(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();

  await restoreArtifactMutation(supabase, id, user.id);
}

export async function deleteArtifact(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();

  // To truly delete an artifact, we should also delete the file in storage.
  const row = await getArtifactById(supabase, id, user.id);
  if (row) {
    await supabase.storage.from(BUCKET_NAME).remove([row.storage_path]);
  }
  await hardDeleteArtifact(supabase, id, user.id);
}

export async function searchArtifacts(query: string, filters?: Omit<ArtifactFilters, "search">): Promise<ArtifactView[]> {
  return getArtifacts({ ...filters, search: query });
}

export async function getMissionArtifacts(missionId: string): Promise<ArtifactView[]> {
  return getArtifacts({ missionId });
}

export async function getEmployeeArtifacts(employeeId: string): Promise<ArtifactView[]> {
  return getArtifacts({ employeeId });
}

export async function getKnowledgeArtifacts(knowledgeId: string): Promise<ArtifactView[]> {
  return getArtifacts({ knowledgeId });
}
