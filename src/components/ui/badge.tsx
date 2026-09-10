import clsx from "clsx";

const colorMap: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ORDERED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-green-100 text-green-700",
  SHIPPED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  PROCESSED: "bg-blue-100 text-blue-700",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        colorMap[status] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
