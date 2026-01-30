"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSyp } from "@/lib/format";
import ImageOrderExtractor from "@/components/ImageOrderExtractor";
import StepIndicator from "@/components/StepIndicator";

type OrderView = {
  orderToken: string;
  status: "PENDING" | "PAID" | "FAILED";
  amount: number;
  method: "SYRIATEL" | "MTN" | null;
  phone: string | null;
  referenceCode: string;
};

type PayClientProps = {
  order: OrderView;
  merchantNumbers: { syriatel: string; mtn: string };
};

export default function PayClient({ order, merchantNumbers }: PayClientProps) {
  const router = useRouter();
  const [currentOrder, setCurrentOrder] = useState(order);
  const [method, setMethod] = useState<OrderView["method"]>(order.method);
  
  // Helper function to format phone number for display
  const formatPhoneForDisplay = (phoneValue: string): string => {
    if (!phoneValue) return "";
    // If already formatted, return as is
    if (phoneValue.includes("+") && phoneValue.includes(" ")) return phoneValue;
    // Otherwise format it
    let val = phoneValue.replace(/\D/g, '');
    if (val.startsWith('0')) val = val.substring(1);
    if (val && !val.startsWith('963')) val = '963' + val;
    if (val.length > 12) val = val.slice(0, 12);

    let formatted = '';
    if (val.length > 0) formatted += '+' + val.slice(0, 3);
    if (val.length > 3) formatted += ' ' + val.slice(3, 6);
    if (val.length > 6) formatted += ' ' + val.slice(6, 9);
    if (val.length > 9) formatted += ' ' + val.slice(9, 12);
    return formatted;
  };

  const [phone, setPhone] = useState(formatPhoneForDisplay(order.phone ?? ""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingVerificationCode, setPendingVerificationCode] = useState<string | null>(null);

  const instructionsReady = Boolean(currentOrder.method && currentOrder.phone);

  const merchantNumber = useMemo(() => {
    if (currentOrder.method === "SYRIATEL") return merchantNumbers.syriatel;
    if (currentOrder.method === "MTN") return merchantNumbers.mtn;
    return null;
  }, [currentOrder.method, merchantNumbers.mtn, merchantNumbers.syriatel]);

  // Track which step to display (only one at a time)
  const [displayStep, setDisplayStep] = useState<0 | 1 | 2>(0);
  
  // Determine current step
  const steps = useMemo(() => {
    const hasDetails = Boolean(currentOrder.method && currentOrder.phone);
    const isPaid = currentOrder.status === "PAID";
    
    type StepStatus = "pending" | "active" | "completed";
    
    // Step 1: active if no details, completed if has details
    const step1Status: StepStatus = hasDetails ? "completed" : "active";
    
    // Step 2: 
    // - completed if user moved to step 3 (displayStep === 2) or if paid
    // - active if user is on step 2 (displayStep === 1)
    // - pending if user is on step 1 (displayStep === 0)
    const step2Status: StepStatus = isPaid || displayStep === 2 ? "completed" : displayStep === 1 ? "active" : "pending";
    
    // Step 3:
    // - completed if paid
    // - active if user is on step 3 (displayStep === 2)
    // - pending otherwise
    const step3Status: StepStatus = isPaid ? "completed" : displayStep === 2 ? "active" : "pending";
    
    return [
      {
        id: "details",
        title: "معلومات الدفع",
        description: "اختر طريقة الدفع",
        status: step1Status,
      },
      {
        id: "instructions",
        title: "تعليمات الدفع",
        description: "اطلع على التفاصيل",
        status: step2Status,
      },
      {
        id: "payment",
        title: "إتمام الدفع",
        description: "تحقق من الدفع",
        status: step3Status,
      },
    ];
  }, [currentOrder.method, currentOrder.phone, currentOrder.status, displayStep]);
  
  // Update display step based on order state
  useEffect(() => {
    if (!instructionsReady) {
      setDisplayStep(0); // Show step 1 if no details
    } else if (currentOrder.status === "PAID") {
      setDisplayStep(2); // Show step 3 if paid
    } else if (instructionsReady) {
      // After saving details, show step 2 (instructions)
      setDisplayStep(1);
    }
  }, [instructionsReady, currentOrder.status]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) val = val.substring(1);
    if (val && !val.startsWith('963')) val = '963' + val;
    if (val.length > 12) val = val.slice(0, 12);

    let formatted = '';
    if (val.length > 0) formatted += '+' + val.slice(0, 3);
    if (val.length > 3) formatted += ' ' + val.slice(3, 6);
    if (val.length > 6) formatted += ' ' + val.slice(6, 9);
    if (val.length > 9) formatted += ' ' + val.slice(9, 12);

    setPhone(formatted);
  };

  const refreshStatus = async () => {
    const response = await fetch(`/api/orders/${currentOrder.orderToken}/status`);
    if (!response.ok) return;
    const data = (await response.json()) as OrderView;
    setCurrentOrder((prev) => ({ ...prev, ...data }));
    // Update phone display format when order is refreshed
    if (data.phone) {
      setPhone(formatPhoneForDisplay(data.phone));
    }
  };

  const onSaveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      // Extract only digits from formatted phone for storage
      const phoneDigits = phone.replace(/\D/g, '');
      
      const response = await fetch(
        `/api/orders/${currentOrder.orderToken}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method, phone: phoneDigits }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error ?? "Unable to save details.");
        return;
      }
      setCurrentOrder(data);
      // Update phone display format
      if (data.phone) {
        setPhone(formatPhoneForDisplay(data.phone));
      }
      // Move to step 2 immediately after saving
      if (data.method && data.phone) {
        setDisplayStep(1);
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/orders/${currentOrder.orderToken}/check-payment`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error ?? "Unable to check payment.");
        setLoading(false);
        return;
      }
      
      // Update order status
      setCurrentOrder(data);
      
      // If still pending, show helpful message
      if (data.status === "PENDING") {
        setMessage("Payment status checked. Your payment is pending manual confirmation by admin. Please wait...");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      setMessage("Unable to check payment right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmVerificationCode = async () => {
    if (!pendingVerificationCode) return;
    
    setShowConfirmModal(false);
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/orders/${currentOrder.orderToken}/save-verification-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationCode: pendingVerificationCode }),
        }
      );
      
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error ?? "فشل في حفظ الرقم.");
        setLoading(false);
        return;
      }
      
      // After saving, redirect to confirmation page
      router.push(`/payment-confirmed/${currentOrder.orderToken}`);
    } catch (error) {
      console.error("Error saving verification code:", error);
      setMessage("حدث خطأ أثناء حفظ الرقم. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrder.status === "PAID") {
      router.replace(`/register/${currentOrder.orderToken}`);
    }
  }, [currentOrder.orderToken, currentOrder.status, router]);

  useEffect(() => {
    if (currentOrder.status !== "PENDING") return;
    const timer = setInterval(() => {
      refreshStatus();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentOrder.status]);

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">دفع ثمن التذكرة</h1>
      <p className="text-sm text-slate-600 mb-8">
        حالة الطلب: <strong className="capitalize">{currentOrder.status === "PENDING" ? "قيد الانتظار" : currentOrder.status === "PAID" ? "مدفوع" : "فشل"}</strong>
      </p>

      {/* Step Indicator */}
      <div className="mb-8 pb-8 border-b border-slate-200">
        <StepIndicator steps={steps} />
      </div>

      {/* Step 1: Payment Details */}
      {displayStep === 0 && (
      <div className="transition-opacity duration-200 ease-out">
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            steps[0].status === "completed" 
              ? "bg-emerald-500 text-white" 
              : steps[0].status === "active"
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-slate-400"
          }`}>
            {steps[0].status === "completed" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-sm font-semibold">1</span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{steps[0].title}</h2>
        </div>
        <form className="grid gap-4" onSubmit={onSaveDetails}>
          <div>
            <label className="text-sm font-medium text-slate-700">
              طريقة الدفع
            </label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={method ?? ""}
              onChange={(event) =>
                setMethod(event.target.value as OrderView["method"])
              }
              required
              disabled={steps[0].status === "completed"}
            >
              <option value="" disabled>
                اختر طريقة الدفع
              </option>
              <option value="SYRIATEL">Syriatel Cash</option>
              <option value="MTN">MTN Cash</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              رقم هاتفك
            </label>
            <input
              type="tel"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+963 XXX XXX XXX"
              required
              disabled={steps[0].status === "completed"}
              maxLength={16}
            />
          </div>
          {steps[0].status !== "completed" && (
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-opacity duration-200"
            >
              {loading ? "جاري الحفظ..." : "حفظ معلومات الدفع"}
            </button>
          )}
          {steps[0].status === "completed" && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 transition-opacity duration-200">
              ✓ تم حفظ معلومات الدفع بنجاح
            </div>
          )}
        </form>
      </div>
      )}

      {/* Step 2: Payment Instructions */}
      {displayStep === 1 && instructionsReady && (
      <div className="transition-opacity duration-200 ease-out">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              steps[1].status === "completed" 
                ? "bg-emerald-500 text-white" 
                : steps[1].status === "active"
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-400"
            }`}>
              {steps[1].status === "completed" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">2</span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{steps[1].title}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              تفاصيل الدفع
            </h3>
            {merchantNumber ? (
              <>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex justify-between items-center">
                    <span>المبلغ:</span>
                    <strong className="text-slate-900">{formatSyp(currentOrder.amount)}</strong>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>رقم المحفظة:</span>
                    <strong className="text-slate-900 font-mono">{merchantNumber}</strong>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>رمز التذكرة:</span>
                    <strong className="text-slate-900 font-mono">{currentOrder.referenceCode}</strong>
                  </li>
                </ul>
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>تعليمات الدفع:</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    قم بالدفع باستخدام تطبيق Syriatel Cash أو MTN Cash أو USSD، وأضف رمز المرجع في الملاحظات إن أمكن.
                  </p>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  ⓘ بعد الدفع، سيتم تأكيد طلبك يدوياً من قبل المسؤول. ستتم تحديث هذه الصفحة تلقائياً عند التأكيد.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setDisplayStep(2)}
                    className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-opacity duration-200"
                  >
                    لقد قمت بالدفع
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠ تحذير</p>
                <p>لم يتم العثور على رقم المحفظة لطريقة الدفع المختارة ({currentOrder.method}). يرجى التحقق من الإعدادات.</p>
              </div>
            )}
          </div>
      </div>
      )}

      {/* Step 3: Payment Verification */}
      {displayStep === 2 && instructionsReady && (
      <div className="transition-opacity duration-200 ease-out">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              steps[2].status === "completed" 
                ? "bg-emerald-500 text-white" 
                : steps[2].status === "active"
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-400"
            }`}>
              {steps[2].status === "completed" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">3</span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{steps[2].title}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              التحقق من رقم الطلب من الصورة
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              يمكنك رفع صورة لإيصال الدفع أو أي صورة تحتوي على رقم الطلب (Reference Code) للتحقق منه
            </p>
            <ImageOrderExtractor
              onExtract={(orderNumber) => {
                // Show confirmation popup before saving
                setPendingVerificationCode(orderNumber);
                setShowConfirmModal(true);
              }}
              label="رفع صورة تحتوي على رقم الطلب (Reference Code)"
              placeholder="أو أدخل رقم الطلب يدوياً للتحقق"
            />
          </div>
      </div>
      )}

      {message ? (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
          message.includes("error") || message.includes("Unable") 
            ? "bg-rose-50 text-rose-700" 
            : message.includes("Payment details saved")
            ? "bg-emerald-50 text-emerald-700"
            : "bg-blue-50 text-blue-700"
        }`}>
          {message}
        </div>
      ) : null}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              تأكيد الرقم المدخل
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              الرقم المدخل:
            </p>
            <p className="text-lg font-mono font-semibold text-slate-900 mb-6 bg-slate-50 p-3 rounded-xl">
              {pendingVerificationCode}
            </p>
            <p className="text-sm text-slate-600 mb-6">
              هل أنت متأكد من صحة هذا الرقم؟
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingVerificationCode(null);
                }}
                className="flex-1 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmVerificationCode}
                disabled={loading}
                className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                {loading ? "جاري الحفظ..." : "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
