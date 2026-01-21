import { NextResponse } from "next/server";
import { getOrderByToken, updateOrder } from "@/lib/db";

type Params = { params: Promise<{ orderToken: string }> | { orderToken: string } };

export async function POST(request: Request, { params }: Params) {
  const resolvedParams = await Promise.resolve(params);
  const body = await request.json();
  const { verificationCode } = body;

  if (!verificationCode || typeof verificationCode !== "string") {
    return NextResponse.json(
      { error: "Verification code is required." },
      { status: 400 }
    );
  }

  // Limit to 20 characters
  const code = verificationCode.trim().substring(0, 20);

  const order = await getOrderByToken(resolvedParams.orderToken);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    // Update order with verification code
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .update({ entered_verification_code: code })
      .eq('order_token', resolvedParams.orderToken)
      .select()
      .single();

    if (error) {
      console.error("Error saving verification code:", error);
      // If column doesn't exist, provide helpful error message
      if (error.message?.includes('column') || error.code === '42703') {
        return NextResponse.json(
          { error: "Database column not found. Please run the migration: ALTER TABLE orders ADD COLUMN entered_verification_code TEXT;" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Failed to save verification code." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verificationCode: code,
    });
  } catch (error) {
    console.error("Error saving verification code:", error);
    return NextResponse.json(
      { error: "Failed to save verification code." },
      { status: 500 }
    );
  }
}
