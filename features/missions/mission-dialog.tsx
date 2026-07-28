"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function MissionDialog({ isOpen, onClose, title, children, className }: MissionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "backdrop:bg-background/80 backdrop:backdrop-blur-sm",
        "bg-card text-card-foreground shadow-lg border border-border rounded-xl w-full max-w-lg p-0",
        "open:animate-in open:fade-in-90 open:zoom-in-95",
        className
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1"
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 pt-4">{children}</div>
      </div>
    </dialog>
  );
}
