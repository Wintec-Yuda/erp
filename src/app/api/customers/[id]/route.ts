import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { customerSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("STAFF");
    const { id } = await params;
    const body = customerSchema.partial().parse(await req.json());
    const customer = await prisma.customer.update({ where: { id }, data: body });
    return apiSuccess(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    await prisma.customer.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
