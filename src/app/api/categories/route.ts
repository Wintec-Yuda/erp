import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { categorySchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession();
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = categorySchema.parse(await req.json());
    const category = await prisma.category.create({ data: body });
    return apiSuccess(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
