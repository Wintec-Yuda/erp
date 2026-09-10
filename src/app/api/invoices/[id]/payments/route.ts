import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { paymentSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * Records a payment against an invoice, then recomputes paidAmount/status
 * (UNPAID -> PARTIALLY_PAID -> PAID) atomically.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireSession("STAFF");
    const { id: invoiceId } = await params;
    const body = paymentSchema.parse(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
      const newPaidAmount = invoice.paidAmount + body.amount;

      if (newPaidAmount > invoice.amount) {
        throw new Error("Payment exceeds remaining invoice balance");
      }

      const status =
        newPaidAmount >= invoice.amount ? "PAID" : newPaidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID";

      const payment = await tx.payment.create({
        data: { invoiceId, amount: body.amount, method: body.method, note: body.note },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaidAmount, status },
      });

      return { payment, invoice: updatedInvoice };
    });

    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("exceeds")) {
      return apiError(error.message, 422);
    }
    return handleApiError(error);
  }
}
