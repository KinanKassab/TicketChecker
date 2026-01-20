import { NextResponse } from "next/server";
import { getOrderByToken } from "@/lib/db";

type Params = { params: Promise<{ orderToken: string }> | { orderToken: string } };

export async function GET(_request: Request, { params }: Params) {
  const resolvedParams = await Promise.resolve(params);
  const order = await getOrderByToken(resolvedParams.orderToken);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    orderToken: order.order_token,
    status: order.status,
    amount: order.amount,
    method: order.method,
    phone: order.phone,
    referenceCode: order.reference_code,
  });
}
