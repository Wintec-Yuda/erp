"use client";

import { SimpleCrudTable } from "@/components/crud/simple-crud-table";

type Warehouse = { id: string; name: string; location: string | null };

export default function WarehousesPage() {
  return (
    <SimpleCrudTable<Warehouse>
      resource="warehouses"
      title="Warehouses"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "location", label: "Location" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "location", label: "Location" },
      ]}
    />
  );
}
