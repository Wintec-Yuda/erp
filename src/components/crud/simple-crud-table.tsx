"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Trash2 } from "lucide-react";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea";
  required?: boolean;
};

/**
 * Generic list + create/edit/delete UI for simple entities (Category,
 * Warehouse, Supplier, Customer, Department, Account, ...). Keeps each
 * simple module page tiny while sharing consistent UX and data-fetching
 * logic via react-query + axios.
 */
export function SimpleCrudTable<T extends { id: string }>({
  resource,
  title,
  fields,
  columns,
  canWrite = true,
}: {
  resource: string;
  title: string;
  fields: FieldDef[];
  columns: { key: string; label: string; render?: (item: T) => ReactNode }[];
  canWrite?: boolean;
}) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: [resource],
    queryFn: async () => (await api.get<{ data: T[] }>(`/${resource}`)).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(`/${resource}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch(`/${resource}/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });

  function openCreate() {
    setEditing(null);
    setForm({});
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    setForm(
      Object.fromEntries(fields.map((f) => [f.name, String((item as never)[f.name] ?? "")]))
    );
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = form[field.name] ?? "";
      payload[field.name] = field.type === "number" ? Number(raw || 0) : raw;
    }
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
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
              {canWrite && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  No data yet
                </td>
              </tr>
            )}
            {data?.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-slate-700">
                    {c.render ? c.render(item) : String((item as never)[c.key] ?? "-")}
                  </td>
                ))}
                {canWrite && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-indigo-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this item?")) deleteMutation.mutate(item.id);
                        }}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-700">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  value={form[field.name] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <input
                  type={field.type ?? "text"}
                  required={field.required}
                  value={form[field.name] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
