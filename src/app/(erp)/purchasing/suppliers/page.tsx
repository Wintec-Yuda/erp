"use client";

import { SimpleCrudTable } from "@/components/crud/simple-crud-table";

type Supplier = { id: string; name: string; email: string | null; phone: string | null };

export default function SuppliersPage() {
  return (
    <SimpleCrudTable<Supplier>
      resource="suppliers"
      title="Suppliers"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone" },
        { name: "address", label: "Address", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
      ]}
    />
  );
}
