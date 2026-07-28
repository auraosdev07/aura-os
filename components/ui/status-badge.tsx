interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
}

export function StatusBadge({ status, variant = "default", className = "" }: StatusBadgeProps) {
  const variantStyles = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${variantStyles[variant]} ${className}`}>
      {status}
    </span>
  );
}
