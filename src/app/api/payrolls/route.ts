import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { payrollSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const period = req.nextUrl.searchParams.get("period") ?? undefined;
    const payrolls = await prisma.payroll.findMany({
      where: period ? { period } : undefined,
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(payrolls);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession("MANAGER");
    const body = payrollSchema.parse(await req.json());
    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: body.employeeId } });
    const netSalary = employee.baseSalary + body.allowance - body.deduction;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: body.employeeId,
        period: body.period,
        baseSalary: employee.baseSalary,
        allowance: body.allowance,
        deduction: body.deduction,
        netSalary,
      },
    });
    return apiSuccess(payroll, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
