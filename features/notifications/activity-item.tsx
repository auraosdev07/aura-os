"use client";

import type { TimelineItem } from "@/services/notification";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Settings,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Shield,
  FileIcon
} from "lucide-react";

interface ActivityItemProps {
  item: TimelineItem;
}

function getIconForType(type: string) {
  switch (type) {
    case "SYSTEM": return <Settings className="h-4 w-4" />;
    case "INFO": return <Info className="h-4 w-4 text-blue-500" />;
    case "SUCCESS": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "WARNING": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "ERROR": return <XCircle className="h-4 w-4 text-red-500" />;
    case "AI": return <BrainCircuit className="h-4 w-4 text-purple-500" />;
    case "AUTOMATION": return <Settings className="h-4 w-4 text-orange-500" />;
    default: return <Info className="h-4 w-4" />;
  }
}

function getIconForActor(actor: string) {
  switch (actor) {
    case "SYSTEM": return <Settings className="h-3 w-3" />;
    case "OWNER": return <Shield className="h-3 w-3" />;
    case "MANAGER": return <User className="h-3 w-3" />;
    case "EMPLOYEE": return <User className="h-3 w-3" />;
    case "AI": return <BrainCircuit className="h-3 w-3" />;
    default: return <User className="h-3 w-3" />;
  }
}

export function ActivityItem({ item }: ActivityItemProps) {
  return (
    <div className="relative pl-8 py-4 border-l border-border last:border-0 last:pb-0">
      <div className="absolute left-0 top-4 -translate-x-1/2 bg-background border rounded-full p-1.5 shadow-sm">
        {getIconForType(item.type)}
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Intl.DateTimeFormat("en-US", { 
              month: "short", 
              day: "numeric", 
              hour: "numeric", 
              minute: "2-digit" 
            }).format(new Date(item.timestamp))}
          </span>
        </div>
        
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            {getIconForActor(item.actor)}
            <span>{item.actor.toLowerCase()}</span>
          </div>

          {item.entityType && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <FileIcon className="h-3 w-3" />
              <span>{item.entityType.toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
