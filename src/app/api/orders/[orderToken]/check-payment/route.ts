import { NextResponse } from "next/server";
import { getOrderByToken } from "@/lib/db";

type Params = { params: Promise<{ orderToken: string }> | { orderToken: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const order = await getOrderByToken(resolvedParams.orderToken);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Note: In Phase 1, payment confirmation is manual via admin.
    // This endpoint just returns current status.
    // Admin must mark order as PAID from /admin dashboard.

    return NextResponse.json({
      orderToken: order.order_token,
      status: order.status,
      amount: order.amount,
      method: order.method,
      phone: order.phone,
      referenceCode: order.reference_code,
    });
  } catch (error) {
    console.error("Error in check-payment:", error);
    return NextResponse.json(
      { error: "Unable to check payment status." },
      { status: 500 }
    );
  }
}
