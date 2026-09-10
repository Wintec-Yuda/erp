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

type Employee = { id: string; fullName: string; baseSalary: number };
type Payroll = {
  id: string;
  period: string;
  baseSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  status: string;
  employee: Employee;
};

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", period: "", allowance: "0", deduction: "0" });

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ["payrolls"],
    queryFn: async () => (await api.get<{ data: Payroll[] }>("/payrolls")).data.data,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get<{ data: Employee[] }>("/employees")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/payrolls", {
        employeeId: form.employeeId,
        period: form.period,
        allowance: Number(form.allowance),
        deduction: Number(form.deduction),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      setOpen(false);
      setForm({ employeeId: "", period: "", allowance: "0", deduction: "0" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/payrolls/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payrolls"] }),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Payroll</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Run Payroll
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Base</th>
              <th className="px-4 py-3 font-medium">Allowance</th>
              <th className="px-4 py-3 font-medium">Deduction</th>
              <th className="px-4 py-3 font-medium">Net</th>
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
            {payrolls?.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{p.employee.fullName}</td>
                <td className="px-4 py-3">{p.period}</td>
                <td className="px-4 py-3">{p.baseSalary.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3">{p.allowance.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3">{p.deduction.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 font-medium">{p.netSalary.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3"><Badge status={p.status} /></td>
                <td className="px-4 py-3 text-right">
                  {p.status === "DRAFT" && (
                    <Button variant="secondary" onClick={() => statusMutation.mutate({ id: p.id, status: "PROCESSED" })}>
                      Process
                    </Button>
                  )}
                  {p.status === "PROCESSED" && (
                    <Button variant="secondary" onClick={() => statusMutation.mutate({ id: p.id, status: "PAID" })}>
                      Mark Paid
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Run Payroll">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Field>Employee</Field>
            <Select required value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
              <option value="">Select employee</option>
              {employees?.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </Select>
          </div>
          <div>
            <Field>Period (e.g. 2026-09)</Field>
            <Input required placeholder="2026-09" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field>Allowance</Field>
              <Input type="number" value={form.allowance} onChange={(e) => setForm((f) => ({ ...f, allowance: e.target.value }))} />
            </div>
            <div>
              <Field>Deduction</Field>
              <Input type="number" value={form.deduction} onChange={(e) => setForm((f) => ({ ...f, deduction: e.target.value }))} />
            </div>
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
