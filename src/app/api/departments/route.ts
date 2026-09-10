import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { departmentSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession();
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { employees: true } } },
    });
    return apiSuccess(departments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = departmentSchema.parse(await req.json());
    const department = await prisma.department.create({ data: body });
    return apiSuccess(department, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
