import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProfileAvatar({
  name,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : "?";

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-3xl",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium shrink-0",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
