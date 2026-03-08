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

  // Get actual values from merchantConfig (Proxy) before passing to client
  const merchantNumbers = {
    syriatel: merchantConfig.syriatel,
    mtn: merchantConfig.mtn,
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      {/* Ambient glow orbs - match main site */}
      <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(180,226,55,0.3), transparent 70%)" }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none z-0 opacity-30" style={{ background: "radial-gradient(circle, rgba(39,170,226,0.4), transparent 70%)" }} />
      <div className="relative z-10">
      <PayClient
        order={{
          orderToken: order.order_token,
          status: order.status,
          amount: order.amount,
          method: order.method,
          phone: order.phone,
          referenceCode: order.reference_code,
        }}
        merchantNumbers={merchantNumbers}
      />
      </div>
    </main>
  );
  } catch (error) {
    console.error("Error loading order:", error);
    notFound();
  }
}
