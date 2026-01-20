import { notFound } from "next/navigation";
import PayClient from "./PayClient";
import { getOrderByToken } from "@/lib/db";
import { merchantConfig } from "@/lib/config";

type PayPageProps = {
  params: Promise<{ orderToken: string }> | { orderToken: string };
};

export default async function PayPage({ params }: PayPageProps) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const order = await getOrderByToken(resolvedParams.orderToken);

    if (!order) {
      console.error("Order not found:", resolvedParams.orderToken);
      notFound();
    }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <PayClient
        order={{
          orderToken: order.order_token,
          status: order.status,
          amount: order.amount,
          method: order.method,
          phone: order.phone,
          referenceCode: order.reference_code,
        }}
        merchantNumbers={merchantConfig}
      />
    </main>
  );
  } catch (error) {
    console.error("Error loading order:", error);
    notFound();
  }
}
