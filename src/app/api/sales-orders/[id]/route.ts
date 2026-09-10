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
    const order = await prisma.salesOrder.findUniqueOrThrow({
      where: { id },
      include: { customer: true, items: { include: { product: true } }, createdBy: true, invoices: true },
    });
    return apiSuccess(order);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Updates SO status. When transitioning to CONFIRMED, deducts stock (from
 * the given warehouseId) for every item, failing the whole transaction if
 * any item has insufficient stock.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("STAFF");
    const { id } = await params;
    const json = await req.json();
    const { status } = orderStatusSchema.parse(json);
    const warehouseId = json.warehouseId as string | undefined;

    if (status === "CONFIRMED") {
      if (!warehouseId) return apiError("warehouseId is required to confirm order", 422);

      const order = await prisma.$transaction(async (tx) => {
        const so = await tx.salesOrder.update({
          where: { id },
          data: { status: "CONFIRMED" },
          include: { items: true },
        });

        for (const item of so.items) {
          const stock = await tx.stock.findUnique({
            where: { productId_warehouseId: { productId: item.productId, warehouseId } },
          });
          if (!stock || stock.quantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }
          await tx.stock.update({
            where: { productId_warehouseId: { productId: item.productId, warehouseId } },
            data: { quantity: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId,
              type: "OUT",
              quantity: item.quantity,
              reference: so.code,
              note: `Shipped for SO ${so.code}`,
            },
          });
        }

        return so;
      });

      return apiSuccess(order);
    }

    const order = await prisma.salesOrder.update({
      where: { id },
      data: { status: status as never },
    });
    return apiSuccess(order);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Insufficient")) {
      return apiError(error.message, 422);
    }
    return handleApiError(error);
  }
}
