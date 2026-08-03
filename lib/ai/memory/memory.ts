/**
 * lib/ai/memory/memory.ts
 *
 * Public API Facade for Aura OS Long-Term Memory System.
 */

import {
  writeMemoryStore,
  retrieveMemoryStore,
  searchMemoryStore,
  deleteMemoryStore,
  updateMemoryImportanceStore,
} from "./memory-store";
import type {
  WriteMemoryInput,
  RetrieveMemoryOptions,
  SearchMemoryOptions,
  MemoryItem,
} from "./memory-types";

export async function writeMemory(input: WriteMemoryInput): Promise<MemoryItem> {
  return writeMemoryStore(input);
}

export async function retrieveMemory(options: RetrieveMemoryOptions): Promise<MemoryItem[]> {
  return retrieveMemoryStore(options);
}

export async function searchMemory(options: SearchMemoryOptions): Promise<MemoryItem[]> {
  return searchMemoryStore(options);
}

export async function deleteMemory(id: string, ownerId: string): Promise<boolean> {
  return deleteMemoryStore(id, ownerId);
}

export async function updateMemoryImportance(
  id: string,
  importance: number,
  ownerId: string
): Promise<MemoryItem | null> {
  return updateMemoryImportanceStore(id, importance, ownerId);
}
