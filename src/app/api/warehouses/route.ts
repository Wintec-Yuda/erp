import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { warehouseSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession();
    const warehouses = await prisma.warehouse.findMany({ orderBy: { name: "asc" } });
    return apiSuccess(warehouses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = warehouseSchema.parse(await req.json());
    const warehouse = await prisma.warehouse.create({ data: body });
    return apiSuccess(warehouse, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
