import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { productSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireSession();
    const { id } = await params;
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: { category: true, stocks: { include: { warehouse: true } } },
    });
    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    const body = productSchema.partial().parse(await req.json());
    const product = await prisma.product.update({ where: { id }, data: body });
    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
