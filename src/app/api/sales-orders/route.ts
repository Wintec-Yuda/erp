import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { salesOrderSchema } from "@/lib/validations";
import { generateOrderCode } from "@/lib/codes";

export async function GET() {
  try {
    await requireSession();
    const orders = await prisma.salesOrder.findMany({
      include: { customer: true, items: { include: { product: true } }, createdBy: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession("STAFF");
    const body = salesOrderSchema.parse(await req.json());

    const totalAmount = body.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const order = await prisma.salesOrder.create({
      data: {
        code: generateOrderCode("SO"),
        customerId: body.customerId,
        totalAmount,
        createdById: session.user.id,
        items: {
          create: body.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } }, customer: true },
    });

    return apiSuccess(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
