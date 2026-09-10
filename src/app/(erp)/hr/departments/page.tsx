"use client";

import { SimpleCrudTable } from "@/components/crud/simple-crud-table";

type Department = { id: string; name: string; _count?: { employees: number } };

export default function DepartmentsPage() {
  return (
    <SimpleCrudTable<Department>
      resource="departments"
      title="Departments"
      fields={[{ name: "name", label: "Name", required: true }]}
      columns={[
        { key: "name", label: "Name" },
        { key: "employees", label: "Employees", render: (d) => d._count?.employees ?? 0 },
      ]}
    />
  );
}
