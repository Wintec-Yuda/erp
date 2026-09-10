import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireSession();

    const [
      productCount,
      lowStockProducts,
      openPurchaseOrders,
      openSalesOrders,
      unpaidInvoices,
      employeeCount,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { stocks: true },
      }),
      prisma.purchaseOrder.count({ where: { status: { in: ["DRAFT", "ORDERED"] } } }),
      prisma.salesOrder.count({ where: { status: { in: ["DRAFT", "CONFIRMED"] } } }),
      prisma.invoice.findMany({ where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } } }),
      prisma.employee.count({ where: { isActive: true } }),
    ]);

    const lowStockCount = lowStockProducts.filter((p) => {
      const total = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      return total <= p.minStock;
    }).length;

    const receivableOutstanding = unpaidInvoices
      .filter((i) => i.type === "RECEIVABLE")
      .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
    const payableOutstanding = unpaidInvoices
      .filter((i) => i.type === "PAYABLE")
      .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

    return apiSuccess({
      productCount,
      lowStockCount,
      openPurchaseOrders,
      openSalesOrders,
      employeeCount,
      receivableOutstanding,
      payableOutstanding,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
