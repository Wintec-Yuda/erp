import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { customerSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession();
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
    return apiSuccess(customers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("STAFF");
    const body = customerSchema.parse(await req.json());
    const customer = await prisma.customer.create({ data: body });
    return apiSuccess(customer, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
