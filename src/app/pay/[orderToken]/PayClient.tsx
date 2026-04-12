"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSyp } from "@/lib/format";
import ImageOrderExtractor from "@/components/ImageOrderExtractor";
import ProjectDropdown from "@/components/ProjectDropdown";
import StepIndicator from "@/components/StepIndicator";
import "@/components/EventLandingContent.module.css";

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
  ticketPriceSyp: number;
};

export default function PayClient({ order, merchantNumbers, ticketPriceSyp }: PayClientProps) {
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
    if (!method) {
      setMessage("يرجى اختيار طريقة الدفع أولاً.");
      return;
    }
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
    <div dir="rtl" lang="ar" className="liquid-glass-strong rounded-3xl p-8 md:p-10 shadow-2xl">
      <h1 className="text-2xl md:text-3xl font-black text-white mb-2">دفع ثمن التذكرة</h1>
      <p className="text-sm text-white/75 mb-8">
        حالة الطلب: <span className="liquid-glass-pill px-3 py-1 text-white/95 font-bold">{currentOrder.status === "PENDING" ? "قيد الانتظار" : currentOrder.status === "PAID" ? "مدفوع" : "فشل"}</span>
      </p>

      {/* Step Indicator */}
      <div className="mb-8 pb-8 border-b border-white/20">
        <StepIndicator steps={steps} variant="glass" />
      </div>

      {/* Step 1: Payment Details */}
      {displayStep === 0 && (
      <div className="transition-opacity duration-200 ease-out">
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            steps[0].status === "completed" 
              ? "bg-[#b4e237] text-white" 
              : steps[0].status === "active"
              ? "bg-white/30 text-white"
              : "bg-white/10 text-white/50"
          }`}>
            {steps[0].status === "completed" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-sm font-semibold">1</span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white">{steps[0].title}</h2>
        </div>
        <form className="grid gap-4" onSubmit={onSaveDetails}>
          <div>
            <ProjectDropdown
              label="طريقة الدفع"
              placeholder="اختر طريقة الدفع"
              value={method ?? ""}
              onChange={(value) => setMethod(value)}
              options={[
                { value: "SYRIATEL", label: "Syriatel Cash" },
                { value: "MTN", label: "MTN Cash" },
              ]}
              disabled={steps[0].status === "completed"}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-white/90">
              رقم هاتفك
            </label>
            <input
              type="tel"
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/25 px-4 py-3 text-sm font-mono text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none"
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
              className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#b4e237]/60 bg-linear-to-r from-[#b4e237]/30 via-[#7dd9ff]/25 to-[#27aae2]/30 px-5 py-3.5 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_10px_28px_rgba(6,28,70,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4ff6b]/85 hover:from-[#b4e237]/40 hover:to-[#27aae2]/38 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_16px_36px_rgba(10,44,98,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ff6b]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#23508f] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "جاري الحفظ..." : "حفظ معلومات الدفع"}
            </button>
          )}
          {steps[0].status === "completed" && (
            <div className="liquid-glass-subtle rounded-xl px-4 py-3 text-sm text-[#b4e237] border border-[#b4e237]/40">
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
                ? "bg-[#b4e237] text-white" 
                : steps[1].status === "active"
                ? "bg-white/30 text-white"
                : "bg-white/10 text-white/50"
            }`}>
              {steps[1].status === "completed" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">2</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white">{steps[1].title}</h2>
          </div>

          <div className="liquid-glass-subtle rounded-2xl p-6 border border-white/20">
            <h3 className="text-base font-bold text-white mb-4">
              تفاصيل الدفع
            </h3>
            <>
              <ul className="space-y-3 text-sm text-white/85">
                <li className="flex justify-between items-center">
                  <span>المبلغ:</span>
                  <strong className="text-white">{formatSyp(ticketPriceSyp)}</strong>
                </li>
                <li className="flex justify-between items-center">
                  <span>رقم المحفظة:</span>
                  <strong dir="ltr" style={{ unicodeBidi: "isolate" }} className="text-white font-mono text-left">
                    {formatPhoneForDisplay(currentOrder.phone ?? "")}
                  </strong>
                </li>
                <li className="flex justify-between items-center">
                  <span>رمز التذكرة:</span>
                  <strong className="text-white font-mono">{currentOrder.referenceCode}</strong>
                </li>
              </ul>
              <div className="mt-4 p-4 rounded-xl bg-[#27aae2]/20 border border-[#27aae2]/40">
                <p className="text-sm text-white font-bold mb-2">
                  تعليمات الدفع:
                </p>
                <p className="text-sm text-white/90">
                  قم بالدفع باستخدام تطبيق Syriatel Cash أو MTN Cash أو Sham Cash، وأضف رمز المرجع في الملاحظات إن أمكن.
                </p>
              </div>
              <p className="mt-4 text-xs text-white/60">
                ⓘ بعد الدفع، سيتم تأكيد طلبك يدوياً من قبل المسؤول. ستتم تحديث هذه الصفحة تلقائياً عند التأكيد، كما ستصلك رسالة على الواتساب تحتوي على التفاصيل.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setDisplayStep(2)}
                  className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#b4e237]/60 bg-linear-to-r from-[#b4e237]/30 via-[#7dd9ff]/25 to-[#27aae2]/30 px-5 py-3.5 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_10px_28px_rgba(6,28,70,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4ff6b]/85 hover:from-[#b4e237]/40 hover:to-[#27aae2]/38 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_16px_36px_rgba(10,44,98,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ff6b]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#23508f]"
                >
                  لقد قمت بالدفع
                </button>
              </div>
            </>
          </div>
      </div>
      )}

      {/* Step 3: Payment Verification */}
      {displayStep === 2 && instructionsReady && (
      <div className="transition-opacity duration-200 ease-out">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              steps[2].status === "completed" 
                ? "bg-[#b4e237] text-white" 
                : steps[2].status === "active"
                ? "bg-white/30 text-white"
                : "bg-white/10 text-white/50"
            }`}>
              {steps[2].status === "completed" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">3</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white">{steps[2].title}</h2>
          </div>

          <div className="liquid-glass-subtle rounded-2xl p-6 border border-white/20">
            <h3 className="text-base font-bold text-white mb-2">
              التحقق من رقم الطلب من الصورة
            </h3>
            <p className="text-sm text-white/75 mb-4">
              يمكنك رفع صورة لإيصال الدفع أو أي صورة تحتوي على رقم الطلب (Reference Code) للتحقق منه
            </p>
            <ImageOrderExtractor
              onExtract={(orderNumber) => {
                setPendingVerificationCode(orderNumber);
                setShowConfirmModal(true);
              }}
              label="رفع صورة تحتوي على رقم الطلب (Reference Code)"
              placeholder="أو أدخل رقم الطلب يدوياً للتحقق"
              variant="glass"
            />
          </div>
      </div>
      )}

      {message ? (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
          message.includes("error") || message.includes("Unable") 
            ? "bg-red-500/20 border border-red-400/40 text-red-200" 
            : message.includes("Payment details saved")
            ? "bg-[#b4e237]/20 border border-[#b4e237]/40 text-[#b4e237]"
            : "bg-[#27aae2]/20 border border-[#27aae2]/40 text-white/90"
        }`}>
          {message}
        </div>
      ) : null}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4">
          <div className="liquid-glass-strong rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              تأكيد الرقم المدخل
            </h3>
            <p className="text-sm text-white/75 mb-2">
              الرقم المدخل:
            </p>
            <p className="text-lg font-mono font-bold text-white mb-6 bg-white/10 p-3 rounded-xl border border-white/20">
              {pendingVerificationCode}
            </p>
            <p className="text-sm text-white/75 mb-6">
              هل أنت متأكد من صحة هذا الرقم؟
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingVerificationCode(null);
                }}
                className="flex-1 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmVerificationCode}
                disabled={loading}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[#b4e237]/60 bg-linear-to-r from-[#b4e237]/30 via-[#7dd9ff]/25 to-[#27aae2]/30 px-5 py-3.5 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_10px_28px_rgba(6,28,70,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4ff6b]/85 hover:from-[#b4e237]/40 hover:to-[#27aae2]/38 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_16px_36px_rgba(10,44,98,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ff6b]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#23508f] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
