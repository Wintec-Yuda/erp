import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireSession();
    const { id } = await params;
    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: {
        purchaseOrder: { include: { supplier: true } },
        salesOrder: { include: { customer: true } },
        payments: true,
      },
    });
    return apiSuccess(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}
