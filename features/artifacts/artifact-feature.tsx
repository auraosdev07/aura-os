"use client";

import { useState } from "react";
import { ArtifactToolbar } from "./artifact-toolbar";
import { ArtifactTable } from "./artifact-table";
import { ArtifactDialog } from "./artifact-dialog";
import { ArtifactForm, type ArtifactFormData } from "./artifact-form";
import { ArtifactEmptyState } from "./artifact-empty-state";
import { Button } from "@/components/ui/button";
import { FileIcon } from "lucide-react";
import { createArtifact, deleteArtifact, type ArtifactView } from "@/services/artifact";
import { useRouter } from "next/navigation";

interface ArtifactFeatureProps {
  initialArtifacts: ArtifactView[];
}

export function ArtifactFeature({ initialArtifacts }: ArtifactFeatureProps) {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const filteredArtifacts = artifacts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = async (data: ArtifactFormData) => {
    setIsUploading(true);
    try {
      const newArtifact = await createArtifact(data);
      setArtifacts([newArtifact, ...artifacts]);
      setIsUploadOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Upload failed", err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this artifact and its file?")) {
      try {
        await deleteArtifact(id);
        setArtifacts(artifacts.filter(a => a.id !== id));
        router.refresh();
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete artifact.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <ArtifactToolbar 
        onSearch={setSearchQuery} 
        onNew={() => setIsUploadOpen(true)} 
      />

      {artifacts.length === 0 ? (
        <ArtifactEmptyState
          title="No artifacts yet"
          description="Upload your first artifact to start building your organization's file repository."
          icon={<FileIcon />}
          action={<Button onClick={() => setIsUploadOpen(true)}>Upload Artifact</Button>}
        />
      ) : (
        <ArtifactTable artifacts={filteredArtifacts} onDelete={handleDelete} />
      )}

      <ArtifactDialog 
        isOpen={isUploadOpen} 
        onClose={() => !isUploading && setIsUploadOpen(false)}
        title="Upload Artifact"
      >
        <ArtifactForm 
          onSubmit={handleUpload} 
          onCancel={() => setIsUploadOpen(false)}
          isSubmitting={isUploading}
        />
      </ArtifactDialog>
    </div>
  );
}
