import { NextRequest, NextResponse } from "next/server";
import { getOrderByReferenceCode } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const referenceCode = searchParams.get("referenceCode");

    if (!referenceCode) {
      return NextResponse.json(
        { error: "رقم الطلب مطلوب" },
        { status: 400 }
      );
    }

    const order = await getOrderByReferenceCode(referenceCode.trim());

    if (!order) {
      return NextResponse.json(
        { error: "لم يتم العثور على الطلب" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderToken: order.order_token,
      status: order.status,
      referenceCode: order.reference_code,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Error finding order:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء البحث عن الطلب" },
      { status: 500 }
    );
  }
}
