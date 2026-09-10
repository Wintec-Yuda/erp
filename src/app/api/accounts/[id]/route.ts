import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const accountSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    const body = accountSchema.parse(await req.json());
    const account = await prisma.account.update({ where: { id }, data: body });
    return apiSuccess(account);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSession("ADMIN");
    const { id } = await params;
    await prisma.account.delete({ where: { id } });
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
