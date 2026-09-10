"use client";

import { SimpleCrudTable } from "@/components/crud/simple-crud-table";

type Category = { id: string; name: string; _count?: { products: number } };

export default function CategoriesPage() {
  return (
    <SimpleCrudTable<Category>
      resource="categories"
      title="Categories"
      fields={[{ name: "name", label: "Name", required: true }]}
      columns={[
        { key: "name", label: "Name" },
        { key: "products", label: "Products", render: (c) => c._count?.products ?? 0 },
      ]}
    />
  );
}
