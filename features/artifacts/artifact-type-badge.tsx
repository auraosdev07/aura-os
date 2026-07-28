import { cn } from "@/lib/utils";
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon, ArchiveIcon } from "lucide-react";

interface ArtifactTypeBadgeProps {
  mimeType: string | null;
  className?: string;
}

export function ArtifactTypeBadge({ mimeType, className }: ArtifactTypeBadgeProps) {
  let Icon = FileIcon;
  let label = "File";
  let colorClass = "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";

  if (mimeType) {
    if (mimeType.includes("image")) {
      Icon = ImageIcon;
      label = "Image";
      colorClass = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    } else if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) {
      Icon = FileTextIcon;
      label = "Document";
      colorClass = "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
    } else if (mimeType.includes("video")) {
      Icon = VideoIcon;
      label = "Video";
      colorClass = "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20";
    } else if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("tar")) {
      Icon = ArchiveIcon;
      label = "Archive";
      colorClass = "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        colorClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
