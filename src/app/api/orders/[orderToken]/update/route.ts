import { NextResponse } from "next/server";
import { getOrderByToken, updateOrder } from "@/lib/db";
import { orderUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ orderToken: string }> | { orderToken: string } };

export async function POST(request: Request, { params }: Params) {
  const resolvedParams = await Promise.resolve(params);
  const body = await request.json();
  const parsed = orderUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data." },
      { status: 400 }
    );
  }

  const order = await getOrderByToken(resolvedParams.orderToken);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const updated = await updateOrder(resolvedParams.orderToken, {
    method: parsed.data.method,
    phone: parsed.data.phone,
  });

  return NextResponse.json({
    orderToken: updated.order_token,
    status: updated.status,
    amount: updated.amount,
    method: updated.method,
    phone: updated.phone,
    referenceCode: updated.reference_code,
  });
}
