"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Category = { id: string; name: string };
type Stock = { quantity: number; warehouse: { name: string } };
type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  categoryId: string | null;
  category: Category | null;
  stocks: Stock[];
};

const emptyForm = {
  sku: "",
  name: "",
  unit: "pcs",
  costPrice: "0",
  sellingPrice: "0",
  minStock: "0",
  categoryId: "",
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get<{ data: Product[] }>("/products")).data.data,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ data: Category[] }>("/categories")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post("/products", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch(`/products/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      minStock: String(p.minStock),
      categoryId: p.categoryId ?? "",
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      sku: form.sku,
      name: form.name,
      unit: form.unit,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      minStock: Number(form.minStock),
      categoryId: form.categoryId || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Products</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading...</td>
              </tr>
            )}
            {products?.map((p) => {
              const totalStock = p.stocks.reduce((s, st) => s + st.quantity, 0);
              const isLow = totalStock <= p.minStock;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.category?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={isLow ? "font-semibold text-red-600" : ""}>{totalStock}</span>{" "}
                    {p.unit}
                  </td>
                  <td className="px-4 py-3">{p.costPrice.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">{p.sellingPrice.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-indigo-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => confirm("Deactivate product?") && deleteMutation.mutate(p.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field>SKU</Field>
              <Input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </div>
            <div>
              <Field>Unit</Field>
              <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <div>
            <Field>Name</Field>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Field>Category</Field>
            <Select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">-</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Field>Cost Price</Field>
              <Input type="number" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
            </div>
            <div>
              <Field>Selling Price</Field>
              <Input type="number" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} />
            </div>
            <div>
              <Field>Min Stock</Field>
              <Input type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
