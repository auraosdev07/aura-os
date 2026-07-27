/**
 * components/ui/input.tsx
 *
 * Reusable Input component.
 * Wraps a native <input> with the project's design system tokens.
 * Accepts all standard HTML input attributes via props spreading.
 */

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-input bg-background px-3.5 py-2.5",
        "text-sm text-foreground placeholder:text-muted-foreground/60",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors",
        className,
      )}
      {...props}
    />
  );
}
