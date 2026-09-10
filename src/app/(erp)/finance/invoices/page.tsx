"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { format } from "date-fns";

type Invoice = {
  id: string;
  code: string;
  type: "PAYABLE" | "RECEIVABLE";
  status: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  purchaseOrder: { code: string; supplier: { name: string } } | null;
  salesOrder: { code: string; customer: { name: string } } | null;
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ type: "RECEIVABLE", amount: "0", dueDate: "" });
  const [payAmount, setPayAmount] = useState("0");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await api.get<{ data: Invoice[] }>("/invoices")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/invoices", { type: form.type, amount: Number(form.amount), dueDate: form.dueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setOpen(false);
      setForm({ type: "RECEIVABLE", amount: "0", dueDate: "" });
    },
  });

  const payMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${payOpen?.id}/payments`, { amount: Number(payAmount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setPayOpen(null);
      setPayAmount("0");
    },
    onError: (error: Error) => alert(error.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Invoices</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Related</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">Loading...</td>
              </tr>
            )}
            {invoices?.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.code}</td>
                <td className="px-4 py-3">{inv.type}</td>
                <td className="px-4 py-3 text-slate-500">
                  {inv.purchaseOrder?.supplier.name ?? inv.salesOrder?.customer.name ?? "-"}
                </td>
                <td className="px-4 py-3">{inv.amount.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3">{inv.paidAmount.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 text-slate-500">{format(new Date(inv.dueDate), "dd MMM yyyy")}</td>
                <td className="px-4 py-3"><Badge status={inv.status} /></td>
                <td className="px-4 py-3 text-right">
                  {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                    <Button variant="secondary" onClick={() => setPayOpen(inv)}>
                      Pay
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New Invoice">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Field>Type</Field>
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="RECEIVABLE">Receivable (from customer)</option>
              <option value="PAYABLE">Payable (to supplier)</option>
            </Select>
          </div>
          <div>
            <Field>Amount</Field>
            <Input type="number" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <Field>Due Date</Field>
            <Input type="date" required value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title={`Record Payment - ${payOpen?.code ?? ""}`}>
        {payOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              payMutation.mutate();
            }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-500">
              Remaining balance: {(payOpen.amount - payOpen.paidAmount).toLocaleString("id-ID")}
            </p>
            <div>
              <Field>Amount</Field>
              <Input type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setPayOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={payMutation.isPending}>
                {payMutation.isPending ? "Saving..." : "Record Payment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
