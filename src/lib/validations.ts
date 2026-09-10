import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
});

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unit: z.string().default("pcs"),
  costPrice: z.number().nonnegative().default(0),
  sellingPrice: z.number().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  categoryId: z.string().optional().nullable(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "TRANSFER"]),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  expectedAt: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const salesOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const orderStatusSchema = z.object({
  status: z.string().min(1),
});

export const invoiceSchema = z.object({
  type: z.enum(["PAYABLE", "RECEIVABLE"]),
  amount: z.number().positive(),
  dueDate: z.string().min(1),
  purchaseOrderId: z.string().optional().nullable(),
  salesOrderId: z.string().optional().nullable(),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "OTHER"]).default("BANK_TRANSFER"),
  note: z.string().optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee code is required"),
  fullName: z.string().min(1, "Full name is required"),
  position: z.string().min(1, "Position is required"),
  departmentId: z.string().optional().nullable(),
  baseSalary: z.number().nonnegative().default(0),
});

export const payrollSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().min(1, "Period is required (e.g. 2026-09)"),
  allowance: z.number().nonnegative().default(0),
  deduction: z.number().nonnegative().default(0),
});
