import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { productSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
            ],
          }
        : undefined,
      include: {
        category: true,
        stocks: { include: { warehouse: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(products);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = productSchema.parse(await req.json());
    const product = await prisma.product.create({ data: body });
    return apiSuccess(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
