"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/form";
import { Plus, Pencil } from "lucide-react";

type Department = { id: string; name: string };
type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  position: string;
  baseSalary: number;
  departmentId: string | null;
  department: Department | null;
  isActive: boolean;
};

const emptyForm = { employeeCode: "", fullName: "", position: "", departmentId: "", baseSalary: "0" };

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get<{ data: Employee[] }>("/employees")).data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get<{ data: Department[] }>("/departments")).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post("/employees", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch(`/employees/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      closeModal();
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      position: emp.position,
      departmentId: emp.departmentId ?? "",
      baseSalary: String(emp.baseSalary),
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
      employeeCode: form.employeeCode,
      fullName: form.fullName,
      position: form.position,
      departmentId: form.departmentId || null,
      baseSalary: Number(form.baseSalary),
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
        <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Base Salary</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading...</td>
              </tr>
            )}
            {employees?.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.employeeCode}</td>
                <td className="px-4 py-3">{e.fullName}</td>
                <td className="px-4 py-3">{e.position}</td>
                <td className="px-4 py-3">{e.department?.name ?? "-"}</td>
                <td className="px-4 py-3">{e.baseSalary.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(e)} className="text-slate-400 hover:text-indigo-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Employee" : "Add Employee"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field>Employee Code</Field>
              <Input required value={form.employeeCode} onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))} />
            </div>
            <div>
              <Field>Position</Field>
              <Input required value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
            </div>
          </div>
          <div>
            <Field>Full Name</Field>
            <Input required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </div>
          <div>
            <Field>Department</Field>
            <Select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
              <option value="">-</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Field>Base Salary</Field>
            <Input type="number" value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} />
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
