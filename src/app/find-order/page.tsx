"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageOrderExtractor from "@/components/ImageOrderExtractor";

type OrderInfo = {
  orderToken: string;
  status: string;
  referenceCode: string;
  amount: number;
} | null;

export default function FindOrderPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderInfo>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrderExtract = async (orderNumber: string) => {
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      // Try to find order by reference code
      const response = await fetch(`/api/orders/find?referenceCode=${encodeURIComponent(orderNumber)}`);
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "لم يتم العثور على الطلب");
        return;
      }

      const orderData = await response.json();
      setOrder(orderData);
    } catch (err) {
      console.error("Error finding order:", err);
      setError("حدث خطأ أثناء البحث عن الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const goToOrder = () => {
    if (order) {
      router.push(`/pay/${order.orderToken}`);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">
          البحث عن الطلب
        </h1>
        <p className="mt-2 text-slate-600">
          ارفع صورة لإيصال الدفع أو أي صورة تحتوي على رقم الطلب (Reference Code) للعثور على طلبك
        </p>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <ImageOrderExtractor
          onExtract={handleOrderExtract}
          label="رفع صورة تحتوي على رقم الطلب"
          placeholder="أو أدخل رقم الطلب يدوياً"
        />

        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="text-sm text-slate-600 mt-2">جاري البحث عن الطلب...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {order && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-lg font-semibold text-emerald-900 mb-4">
              تم العثور على الطلب
            </h2>
            <div className="space-y-2 text-sm text-emerald-800">
              <p>
                <span className="font-medium">رقم الطلب:</span>{" "}
                <strong>{order.referenceCode}</strong>
              </p>
              <p>
                <span className="font-medium">الحالة:</span>{" "}
                <strong>
                  {order.status === "PAID"
                    ? "مدفوع"
                    : order.status === "FAILED"
                    ? "فشل"
                    : "قيد الانتظار"}
                </strong>
              </p>
              <p>
                <span className="font-medium">المبلغ:</span>{" "}
                <strong>{order.amount.toLocaleString()} SYP</strong>
              </p>
            </div>
            <button
              onClick={goToOrder}
              className="mt-4 w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              عرض تفاصيل الطلب
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
