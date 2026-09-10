"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

type Customer = { id: string; name: string };
type Product = { id: string; sku: string; name: string; sellingPrice: number };
type Warehouse = { id: string; name: string };
type Item = { productId: string; quantity: number; unitPrice: number };
type SalesOrder = {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  customer: Customer;
  items: { id: string; quantity: number; unitPrice: number; product: Product }[];
};

export default function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<Item[]>([{ productId: "", quantity: 1, unitPrice: 0 }]);
  const [confirmWarehouse, setConfirmWarehouse] = useState<Record<string, string>>({});

  const { data: orders, isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: async () => (await api.get<{ data: SalesOrder[] }>("/sales-orders")).data.data,
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await api.get<{ data: Customer[] }>("/customers")).data.data,
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
    mutationFn: () => api.post("/sales-orders", { customerId, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      setOpen(false);
      setCustomerId("");
      setItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, warehouseId }: { id: string; status: string; warehouseId?: string }) =>
      api.patch(`/sales-orders/${id}`, { status, warehouseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => alert(error.message),
  });

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Sales Orders</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Sales Order
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading...</td>
              </tr>
            )}
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{o.code}</td>
                <td className="px-4 py-3">{o.customer.name}</td>
                <td className="px-4 py-3 text-slate-500">{format(new Date(o.orderDate), "dd MMM yyyy")}</td>
                <td className="px-4 py-3">{o.totalAmount.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {o.status === "DRAFT" && (
                      <>
                        <Select
                          className="mt-0 w-40"
                          value={confirmWarehouse[o.id] ?? ""}
                          onChange={(e) => setConfirmWarehouse((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        >
                          <option value="">Warehouse...</option>
                          {warehouses?.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </Select>
                        <Button
                          variant="secondary"
                          disabled={!confirmWarehouse[o.id]}
                          onClick={() =>
                            statusMutation.mutate({ id: o.id, status: "CONFIRMED", warehouseId: confirmWarehouse[o.id] })
                          }
                        >
                          Confirm (Deduct Stock)
                        </Button>
                      </>
                    )}
                    {o.status === "CONFIRMED" && (
                      <Button variant="secondary" onClick={() => statusMutation.mutate({ id: o.id, status: "SHIPPED" })}>
                        Mark Shipped
                      </Button>
                    )}
                    {o.status === "SHIPPED" && (
                      <Button variant="secondary" onClick={() => statusMutation.mutate({ id: o.id, status: "COMPLETED" })}>
                        Mark Completed
                      </Button>
                    )}
                    {(o.status === "DRAFT") && (
                      <Button variant="danger" onClick={() => statusMutation.mutate({ id: o.id, status: "CANCELLED" })}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New Sales Order">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Field>Customer</Field>
            <Select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Field>Items</Field>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  className="mt-0 flex-1"
                  required
                  value={item.productId}
                  onChange={(e) => {
                    const product = products?.find((p) => p.id === e.target.value);
                    updateItem(index, {
                      productId: e.target.value,
                      unitPrice: product?.sellingPrice ?? 0,
                    });
                  }}
                >
                  <option value="">Product</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={1}
                  className="mt-0 w-20"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  min={0}
                  className="mt-0 w-28"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                />
                <button type="button" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addItem}>
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>

          <p className="text-right text-sm font-medium text-slate-700">
            Total: {total.toLocaleString("id-ID")}
          </p>

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
