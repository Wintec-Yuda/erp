import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["DRAFT", "PROCESSED", "PAID"]) });

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    const { status } = statusSchema.parse(await req.json());
    const payroll = await prisma.payroll.update({
      where: { id },
      data: { status, processedAt: status === "PROCESSED" ? new Date() : undefined },
    });
    return apiSuccess(payroll);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSession("MANAGER");
    const { id } = await params;
    await prisma.payroll.delete({ where: { id } });
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
