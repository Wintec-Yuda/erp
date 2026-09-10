import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { supplierSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession();
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return apiSuccess(suppliers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = supplierSchema.parse(await req.json());
    const supplier = await prisma.supplier.create({ data: body });
    return apiSuccess(supplier, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
