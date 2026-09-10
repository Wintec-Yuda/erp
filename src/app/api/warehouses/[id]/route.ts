import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { warehouseSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    const body = warehouseSchema.partial().parse(await req.json());
    const warehouse = await prisma.warehouse.update({ where: { id }, data: body });
    return apiSuccess(warehouse);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    await prisma.warehouse.delete({ where: { id } });
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
