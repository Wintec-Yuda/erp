"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Package,
  AlertTriangle,
  Truck,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

type DashboardSummary = {
  productCount: number;
  lowStockCount: number;
  openPurchaseOrders: number;
  openSalesOrders: number;
  employeeCount: number;
  receivableOutstanding: number;
  payableOutstanding: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-md p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<{ data: DashboardSummary }>("/dashboard")).data.data,
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional inventori, penjualan, pembelian, keuangan, dan HR."
      />

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard icon={Package} label="Active Products" value={data.productCount} tone="bg-indigo-50 text-indigo-600" />
          <KpiCard icon={AlertTriangle} label="Low Stock Items" value={data.lowStockCount} tone="bg-amber-50 text-amber-600" />
          <KpiCard icon={Truck} label="Open Purchase Orders" value={data.openPurchaseOrders} tone="bg-blue-50 text-blue-600" />
          <KpiCard icon={ShoppingCart} label="Open Sales Orders" value={data.openSalesOrders} tone="bg-purple-50 text-purple-600" />
          <KpiCard icon={Users} label="Active Employees" value={data.employeeCount} tone="bg-green-50 text-green-600" />
          <KpiCard
            icon={Wallet}
            label="Receivable / Payable"
            value={`${formatCurrency(data.receivableOutstanding)} / ${formatCurrency(data.payableOutstanding)}`}
            tone="bg-rose-50 text-rose-600"
          />
        </div>
      )}
    </div>
  );
}
