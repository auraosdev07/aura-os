"use client";

import { useState, useMemo } from "react";
import type { ManagerView } from "@/services/manager";
import { ManagerStatusBadge } from "./manager-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ManagerTableRow = ManagerView;

interface ManagerTableProps {
  managers: ManagerTableRow[];
  onEdit: (manager: ManagerTableRow) => void;
  onArchive: (manager: ManagerTableRow) => void;
  onRestore: (manager: ManagerTableRow) => void;
}

export function ManagerTable({ managers, onEdit, onArchive, onRestore }: ManagerTableProps) {
  const [search, setSearch] = useState("");
  // Ready for pagination implementation
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || 
             m.email.toLowerCase().includes(q) || 
             m.department.toLowerCase().includes(q);
    });
  }, [managers, search]);

  const paginatedManagers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredManagers.slice(start, start + itemsPerPage);
  }, [filteredManagers, page]);

  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);

  if (managers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/10 border border-border rounded-xl">
        <p className="text-lg font-medium text-foreground">No managers yet</p>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Get started by adding a manager to coordinate your AI employees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar / Search */}
      <div className="flex items-center gap-4">
        <Input 
          placeholder="Search managers..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Missions</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedManagers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No managers match your search.
                  </td>
                </tr>
              ) : (
                paginatedManagers.map((manager) => {
                  const isArchived = manager.deleted_at !== null;
                  return (
                    <tr key={manager.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{manager.name}</div>
                        <div className="text-xs text-muted-foreground">{manager.email}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{manager.department}</td>
                      <td className="px-6 py-4 text-foreground">{manager.activeMissionCount}</td>
                      <td className="px-6 py-4">
                        <ManagerStatusBadge deletedAt={manager.deleted_at} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onEdit(manager)}
                          >
                            Edit
                          </Button>
                          {isArchived ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onRestore(manager)}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => onArchive(manager)}
                            >
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Basic Pagination Controls (Ready for backend/full UI) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredManagers.length)} of {filteredManagers.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
