"use client";

import { useState } from "react";
import { Upload, X, Star, MoveUp, MoveDown, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface MediaItem {
  storage_path: string;
  public_url: string;
  alt_text?: string;
  caption?: string;
  position: number;
  is_primary: boolean;
}

interface MediaGalleryManagerProps {
  images: MediaItem[];
  onChange: (images: MediaItem[]) => void;
}

export function MediaGalleryManager({ images, onChange }: MediaGalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErrorMsg(null);

    const newMediaItems: MediaItem[] = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        const isPrimary = newMediaItems.length === 0;

        newMediaItems.push({
          storage_path: filePath,
          public_url: publicUrlData.publicUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, ""),
          caption: "",
          position: newMediaItems.length,
          is_primary: isPrimary,
        });
      }

      onChange(newMediaItems);
    } catch (err: unknown) {
      console.error("[STORAGE UPLOAD ERROR]:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const remaining = images.filter((_, idx) => idx !== index);
    if (remaining.length > 0 && !remaining.some((img) => img.is_primary)) {
      remaining[0].is_primary = true;
    }
    const reordered = remaining.map((img, idx) => ({ ...img, position: idx }));
    onChange(reordered);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((img, idx) => ({ ...img, position: idx }));
    onChange(reordered);
  };

  const handleMetaChange = (index: number, field: "alt_text" | "caption", val: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" /> Product Images & Media
          </h3>
          <p className="text-xs text-slate-400">
            Upload high-resolution product photos. Drag and reorder thumbnails. Mark one image as Primary.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">{images.length} uploaded</span>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
        }}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragOver ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {uploading ? "Uploading media to Supabase Storage..." : "Drag & drop product images here"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP up to 10MB</p>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {images.map((img, idx) => (
            <div
              key={img.storage_path + idx}
              className={`relative flex gap-3 p-3 bg-slate-900 border rounded-xl transition-all ${
                img.is_primary ? "border-emerald-500/50 bg-emerald-950/20" : "border-slate-800"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.public_url} alt={img.alt_text || "Product image"} className="w-full h-full object-cover" />
                {img.is_primary && (
                  <span className="absolute top-1 left-1 bg-emerald-500 text-slate-950 p-0.5 rounded shadow">
                    <Star className="w-3 h-3 fill-slate-950" />
                  </span>
                )}
              </div>

              {/* Controls & Metadata */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                      img.is_primary
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {img.is_primary ? "Primary Image" : "Set as Primary"}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Alt text (SEO description)"
                  value={img.alt_text || ""}
                  onChange={(e) => handleMetaChange(idx, "alt_text", e.target.value)}
                  className="w-full text-xs px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />

                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={img.caption || ""}
                  onChange={(e) => handleMetaChange(idx, "caption", e.target.value)}
                  className="w-full text-xs px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
