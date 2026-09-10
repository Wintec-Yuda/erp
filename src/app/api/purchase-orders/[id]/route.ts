import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { orderStatusSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireSession();
    const { id } = await params;
    const order = await prisma.purchaseOrder.findUniqueOrThrow({
      where: { id },
      include: { supplier: true, items: { include: { product: true } }, createdBy: true, invoices: true },
    });
    return apiSuccess(order);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Updates PO status. When transitioning to RECEIVED, it needs a warehouseId
 * (passed in body) to create stock-in movements for every item and update
 * stock levels in one transaction.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    const json = await req.json();
    const { status } = orderStatusSchema.parse(json);
    const warehouseId = json.warehouseId as string | undefined;

    if (status === "RECEIVED") {
      if (!warehouseId) return apiError("warehouseId is required to receive stock", 422);

      const order = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.update({
          where: { id },
          data: { status: "RECEIVED" },
          include: { items: true },
        });

        for (const item of po.items) {
          await tx.stock.upsert({
            where: { productId_warehouseId: { productId: item.productId, warehouseId } },
            create: { productId: item.productId, warehouseId, quantity: item.quantity },
            update: { quantity: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId,
              type: "IN",
              quantity: item.quantity,
              reference: po.code,
              note: `Received from PO ${po.code}`,
            },
          });
        }

        return po;
      });

      return apiSuccess(order);
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as never },
    });
    return apiSuccess(order);
  } catch (error) {
    return handleApiError(error);
  }
}
