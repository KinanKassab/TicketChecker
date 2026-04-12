import { notFound } from "next/navigation";
import { getOrderByToken } from "@/lib/db";
import "@/components/EventLandingContent.module.css";

type PaymentConfirmedPageProps = {
  params: Promise<{ orderToken: string }> | { orderToken: string };
};

export default async function PaymentConfirmedPage({ params }: PaymentConfirmedPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const order = await getOrderByToken(resolvedParams.orderToken);

  if (!order) {
    notFound();
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(180,226,55,0.3), transparent 70%)" }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none z-0 opacity-30" style={{ background: "radial-gradient(circle, rgba(39,170,226,0.4), transparent 70%)" }} />

      <div className="relative z-10 liquid-glass-strong rounded-3xl p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#b4e237]/25 border border-[#b4e237]/40 mb-4">
            <svg
              className="w-8 h-8 text-[#b4e237]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            تم إرسال طلبك بنجاح
          </h1>
          <p className="text-sm text-white/75">
            رقم التذكرة: <strong className="font-mono text-white">{order.reference_code}</strong>
          </p>
        </div>

        <div className="liquid-glass-subtle rounded-2xl border border-[#27aae2]/40 bg-[#27aae2]/20 p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-white mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">
                سيتم إرسال التفاصيل على الواتساب
              </h2>
              <p className="text-sm text-white/90">
                سيتم مراجعة طلبك والتواصل معك على رقم الهاتف المسجل ({order.phone}) عبر الواتساب لإرسال تفاصيل التذكرة.
              </p>
            </div>
          </div>
        </div>

        <div className="liquid-glass-subtle rounded-xl p-4 border border-white/25">
          <p className="text-xs text-white/75 text-center">
            ⓘ يرجى الانتظار حتى يتم مراجعة طلبك والتواصل معك. قد يستغرق ذلك بعض الوقت.
          </p>
        </div>
      </div>
    </main>
  );
}
