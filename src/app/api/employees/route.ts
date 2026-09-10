import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { employeeSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession("MANAGER");
    const employees = await prisma.employee.findMany({
      include: { department: true },
      orderBy: { fullName: "asc" },
    });
    return apiSuccess(employees);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = employeeSchema.parse(await req.json());
    const employee = await prisma.employee.create({ data: body });
    return apiSuccess(employee, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
