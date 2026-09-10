import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Warehouse,
  Truck,
  ShoppingCart,
  Users,
  Receipt,
  Wallet,
  UserSquare2,
  Building2,
  BadgeDollarSign,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minimumRole?: Role;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", href: "/inventory/products", icon: Package },
      { label: "Stock", href: "/inventory/stock", icon: Boxes },
      { label: "Categories", href: "/inventory/categories", icon: Boxes },
      { label: "Warehouses", href: "/inventory/warehouses", icon: Warehouse },
    ],
  },
  {
    title: "Purchasing",
    items: [
      { label: "Purchase Orders", href: "/purchasing/orders", icon: Truck },
      { label: "Suppliers", href: "/purchasing/suppliers", icon: Truck },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Sales Orders", href: "/sales/orders", icon: ShoppingCart },
      { label: "Customers", href: "/sales/customers", icon: Users },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices", href: "/finance/invoices", icon: Receipt },
      {
        label: "Chart of Accounts",
        href: "/finance/accounts",
        icon: Wallet,
        minimumRole: "MANAGER",
      },
    ],
  },
  {
    title: "HR",
    items: [
      {
        label: "Employees",
        href: "/hr/employees",
        icon: UserSquare2,
        minimumRole: "MANAGER",
      },
      {
        label: "Departments",
        href: "/hr/departments",
        icon: Building2,
        minimumRole: "MANAGER",
      },
      {
        label: "Payroll",
        href: "/hr/payroll",
        icon: BadgeDollarSign,
        minimumRole: "MANAGER",
      },
    ],
  },
];
