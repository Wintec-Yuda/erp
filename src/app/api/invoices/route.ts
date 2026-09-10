import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { invoiceSchema } from "@/lib/validations";
import { generateOrderCode } from "@/lib/codes";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const type = req.nextUrl.searchParams.get("type") ?? undefined;
    const invoices = await prisma.invoice.findMany({
      where: type ? { type: type as never } : undefined,
      include: { purchaseOrder: { include: { supplier: true } }, salesOrder: { include: { customer: true } }, payments: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(invoices);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = invoiceSchema.parse(await req.json());
    const invoice = await prisma.invoice.create({
      data: {
        code: generateOrderCode(body.type === "PAYABLE" ? "INV-P" : "INV-R"),
        type: body.type,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        purchaseOrderId: body.purchaseOrderId ?? undefined,
        salesOrderId: body.salesOrderId ?? undefined,
      },
    });
    return apiSuccess(invoice, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
