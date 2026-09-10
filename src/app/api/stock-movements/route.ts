import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { stockAdjustmentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const productId = req.nextUrl.searchParams.get("productId") ?? undefined;
    const movements = await prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return apiSuccess(movements);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Records a stock movement and atomically updates the corresponding Stock
 * row. IN/ADJUSTMENT (positive) increase quantity, OUT/TRANSFER decrease it.
 */
export async function POST(req: NextRequest) {
  try {
    await requireSession("STAFF");
    const body = stockAdjustmentSchema.parse(await req.json());
    const delta = body.type === "IN" ? body.quantity : -body.quantity;

    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.upsert({
        where: {
          productId_warehouseId: {
            productId: body.productId,
            warehouseId: body.warehouseId,
          },
        },
        create: {
          productId: body.productId,
          warehouseId: body.warehouseId,
          quantity: Math.max(delta, 0),
        },
        update: { quantity: { increment: delta } },
      });

      if (stock.quantity < 0) {
        throw new Error("Insufficient stock for this movement");
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: body.productId,
          warehouseId: body.warehouseId,
          type: body.type,
          quantity: body.quantity,
          note: body.note,
        },
      });

      return { stock, movement };
    });

    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Insufficient")) {
      return apiError(error.message, 422);
    }
    return handleApiError(error);
  }
}
