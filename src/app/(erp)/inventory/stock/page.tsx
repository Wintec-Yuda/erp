"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { format } from "date-fns";

type Product = { id: string; sku: string; name: string };
type Warehouse = { id: string; name: string };
type Movement = {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: string;
  product: Product;
};

export default function StockPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", warehouseId: "", type: "IN", quantity: "1", note: "" });

  const { data: movements, isLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => (await api.get<{ data: Movement[] }>("/stock-movements")).data.data,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get<{ data: Product[] }>("/products")).data.data,
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => (await api.get<{ data: Warehouse[] }>("/warehouses")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/stock-movements", {
        productId: form.productId,
        warehouseId: form.warehouseId,
        type: form.type,
        quantity: Number(form.quantity),
        note: form.note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setForm({ productId: "", warehouseId: "", type: "IN", quantity: "1", note: "" });
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Stock Movements</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Record Movement
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading...</td>
              </tr>
            )}
            {movements?.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{format(new Date(m.createdAt), "dd MMM yyyy HH:mm")}</td>
                <td className="px-4 py-3">{m.product.name} ({m.product.sku})</td>
                <td className="px-4 py-3">{m.type}</td>
                <td className="px-4 py-3">{m.quantity}</td>
                <td className="px-4 py-3 text-slate-500">{m.note ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Record Stock Movement">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Field>Product</Field>
            <Select required value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
              <option value="">Select product</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </Select>
          </div>
          <div>
            <Field>Warehouse</Field>
            <Select required value={form.warehouseId} onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}>
              <option value="">Select warehouse</option>
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field>Type</Field>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
                <option value="ADJUSTMENT">ADJUSTMENT</option>
              </Select>
            </div>
            <div>
              <Field>Quantity</Field>
              <Input type="number" min={1} required value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
          </div>
          <div>
            <Field>Note</Field>
            <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
