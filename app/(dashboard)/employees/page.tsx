import type { Metadata } from "next";
import { EmployeeFeature } from "@/features/employees/employee-feature";

export const metadata: Metadata = {
  title: "Employees | Aura OS",
  description: "Manage your AI workforce.",
};

export default function EmployeesPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
      </div>
      <div className="w-full">
        <EmployeeFeature />
      </div>
    </div>
  );
}
