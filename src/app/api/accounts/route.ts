import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const accountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
});

export async function GET() {
  try {
    await requireSession("MANAGER");
    const accounts = await prisma.account.findMany({ orderBy: { code: "asc" } });
    return apiSuccess(accounts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = accountSchema.parse(await req.json());
    const account = await prisma.account.create({ data: body });
    return apiSuccess(account, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
