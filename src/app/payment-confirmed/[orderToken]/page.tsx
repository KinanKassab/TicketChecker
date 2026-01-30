import { notFound } from "next/navigation";
import { getOrderByToken } from "@/lib/db";

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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <svg
              className="w-8 h-8 text-emerald-600"
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
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            تم إرسال طلبك بنجاح
          </h1>
          <p className="text-sm text-slate-600">
            رقم الطلب: <strong className="font-mono">{order.reference_code}</strong>
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 mt-0.5 shrink-0"
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
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                سيتم إرسال التفاصيل على الواتساب
              </h2>
              <p className="text-sm text-blue-800">
                سيتم مراجعة طلبك والتواصل معك على رقم الهاتف المسجل ({order.phone}) عبر الواتساب لإرسال تفاصيل التذكرة.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
          <p className="text-xs text-slate-600 text-center">
            ⓘ يرجى الانتظار حتى يتم مراجعة طلبك والتواصل معك. قد يستغرق ذلك بعض الوقت.
          </p>
        </div>
      </div>
    </main>
  );
}
