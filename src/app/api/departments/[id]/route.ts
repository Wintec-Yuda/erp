import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { departmentSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    const body = departmentSchema.partial().parse(await req.json());
    const department = await prisma.department.update({ where: { id }, data: body });
    return apiSuccess(department);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    await prisma.department.delete({ where: { id } });
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
