"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import { createPortal } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { createOrderAction, type CreateOrderResult } from "@/app/actions";

type Props = {
  agentCode: string;
  triggerLabel?: string;
  triggerClassName?: string;
};

export default function RegistrationForm({
  agentCode,
  triggerLabel = "احصل على تذكرتك",
  triggerClassName = "w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1",
}: Props) {
  const minimumAge = 15;
  const today = new Date();
  const maxDobDate = new Date(today.getFullYear() - minimumAge, today.getMonth(), today.getDate());
  const maxDob = `${maxDobDate.getFullYear()}-${String(maxDobDate.getMonth() + 1).padStart(2, "0")}-${String(maxDobDate.getDate()).padStart(2, "0")}`;

  const labelClassName = "mb-1.5 block text-xs font-bold text-white/88";
  const fieldClassName =
    "w-full rounded-xl border border-white/26 bg-linear-to-br from-white/16 via-sky-200/10 to-cyan-200/8 px-4 py-3 text-white placeholder:text-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] outline-none transition-all duration-300 focus:border-cyan-100/90 focus:bg-cyan-100/14 focus:ring-2 focus:ring-cyan-100/45";

  const [state, formAction] = useActionState<CreateOrderResult | null, FormData>(
    createOrderAction,
    null
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);

  // عند فشل التحقق، نحتفظ بالقيم المُدخلة
  useEffect(() => {
    if (state?.ok === false && state.formData) {
      setFormValues(state.formData);
    }
  }, [state]);

  const updateField = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const fieldErrors = state && state.ok === false ? state.fieldErrors : undefined;
  const [isClosing, setIsClosing] = useState(false); // حالة للتحكم في أنيميشن الإغلاق
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      document.body.style.overflow = "unset";
    };
  }, []);

  // دالة التعامل مع الإغلاق لتشغيل الأنيميشن أولاً
  const handleClose = () => {
    setIsClosing(true);
    setFormValues({}); // إعادة تعيين النموذج عند الإغلاق
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 300);
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xl transition-all duration-300 ${
        isClosing ? "animate-out fade-out opacity-0" : "animate-in fade-in opacity-100"
      }`}
      onClick={handleClose} // إغلاق عند الضغط في الخلفية
    >
      <div 
        className={`relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-sky-100/35 bg-linear-to-br from-[#2ea9d7]/34 via-[#2a6fb3]/30 to-[#243b7a]/58 shadow-[0_30px_82px_rgba(6,20,48,0.56)] ring-1 ring-cyan-100/28 backdrop-blur-3xl transition-all duration-300 ${
          isClosing ? "animate-out zoom-out-95 scale-95" : "animate-in zoom-in-95 scale-100"
        }`}
        style={{ overflowX: "hidden" }}
        dir="ltr"
        onClick={(e) => e.stopPropagation()} // منع الإغلاق عند الضغط داخل الفورم
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(180,226,55,0.22),transparent_42%),radial-gradient(circle_at_88%_10%,rgba(255,255,255,0.2),transparent_36%),linear-gradient(160deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_44%,rgba(2,8,23,0.24)_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[1px] rounded-[22px] border border-white/14"
        />

        
        {/* Header */}
        <div dir="rtl" className="relative z-10 flex min-h-[84px] w-full items-center justify-between gap-4 border-b border-white/24 bg-linear-to-r from-[#dff7ff]/34 via-[#8fdaf4]/28 to-[#b4e237]/20 pr-3 pl-5 py-4 backdrop-blur-3xl md:min-h-[92px] md:pr-4 md:pl-6 md:py-5">
           <div>
             <h2 className="text-xl font-black text-white">بيانات الحجز</h2>
             <p className="mt-1 text-xs text-cyan-50/78">خطوة أخيرة لتأكيد انضمامك إلينا</p>
           </div>
           <button 
                onClick={handleClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100/35 bg-linear-to-br from-cyan-200/18 to-white/8 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:border-lime-200/65 hover:bg-lime-200/22 hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* Body */}
        <div dir="rtl" className="premium-modal-scroll relative z-10 max-h-[calc(90vh-84px)] overflow-y-auto p-6 md:max-h-[calc(90vh-92px)] lg:p-8">
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="ref" value={agentCode} />

            {state?.ok === false && (
              <div className="space-y-1 rounded-xl border border-rose-300/60 bg-rose-200/25 px-4 py-3 text-sm text-rose-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                <p className="font-medium">{state.error}</p>
                {fieldErrors && Object.keys(fieldErrors).length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-rose-100/95">
                    {Object.entries(fieldErrors).map(([field, msg]) => (
                      <li key={field}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* القسم الأول: المعلومات الشخصية */}
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/22 bg-linear-to-br from-cyan-200/10 via-white/8 to-blue-300/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl md:grid-cols-2 md:p-6">
              <div className="md:col-span-2">
                <label className={labelClassName}>الاسم الثلاثي</label>
                <input name="fullName" required placeholder="مثال: محمد سامر العلي" value={formValues.fullName ?? ""} onChange={(e) => updateField("fullName", e.target.value)} className={`${fieldClassName} ${fieldErrors?.fullName ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                {fieldErrors?.fullName && <p className="text-red-400 text-xs mt-1">{fieldErrors?.fullName}</p>}
              </div>

              <div>
                  <label className={labelClassName}>تاريخ الميلاد</label>
                  <input type="date" name="dob" required max={maxDob} value={formValues.dob ?? ""} onChange={(e) => updateField("dob", e.target.value)} className={`${fieldClassName} ${fieldErrors?.dob ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                  {fieldErrors?.dob && <p className="text-red-400 text-xs mt-1">{fieldErrors?.dob}</p>}
              </div>
              <div>
                  <label className={labelClassName}>مكان الولادة</label>
                  <input name="pob" required placeholder="المحافظة" value={formValues.pob ?? ""} onChange={(e) => updateField("pob", e.target.value)} className={`${fieldClassName} ${fieldErrors?.pob ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                  {fieldErrors?.pob && <p className="text-red-400 text-xs mt-1">{fieldErrors?.pob}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className={labelClassName}>الدراسة / التخصص</label>
                <input name="specialization" required placeholder="مثال: هندسة معلوماتية" value={formValues.specialization ?? ""} onChange={(e) => updateField("specialization", e.target.value)} className={`${fieldClassName} ${fieldErrors?.specialization ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                {fieldErrors?.specialization && <p className="text-red-400 text-xs mt-1">{fieldErrors?.specialization}</p>}
              </div>
            </div>

            {/* القسم الثاني: الطموح والشغف */}
            <div className="rounded-2xl border border-white/22 bg-linear-to-br from-cyan-200/10 via-white/8 to-blue-300/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="rounded-md border border-cyan-100/45 bg-linear-to-br from-cyan-200/22 to-lime-200/14 p-1.5 text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.26)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    <p className="text-sm font-bold text-white">شاركنا شغفك</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className={labelClassName}>وظيفة تحلم بها</label>
                         <input name="dreamJob" required placeholder="مثال: Senior AI Engineer" value={formValues.dreamJob ?? ""} onChange={(e) => updateField("dreamJob", e.target.value)} className={`${fieldClassName} ${fieldErrors?.dreamJob ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                         {fieldErrors?.dreamJob && <p className="text-red-400 text-xs mt-1">{fieldErrors?.dreamJob}</p>}
                    </div>
                    <div>
                         <label className={labelClassName}>شركة تنتمي لها</label>
                         <input name="company" required placeholder="مثال: Google, Tesla..." value={formValues.company ?? ""} onChange={(e) => updateField("company", e.target.value)} className={`${fieldClassName} ${fieldErrors?.company ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                         {fieldErrors?.company && <p className="text-red-400 text-xs mt-1">{fieldErrors?.company}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                         <label className={labelClassName}>حلمك وطموحك المستقبلي</label>
                         <textarea name="dream" required rows={2} placeholder="اكتب باختصار..." value={formValues.dream ?? ""} onChange={(e) => updateField("dream", e.target.value)} className={`${fieldClassName} resize-none ${fieldErrors?.dream ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`}></textarea>
                         {fieldErrors?.dream && <p className="text-red-400 text-xs mt-1">{fieldErrors?.dream}</p>}
                    </div>

                    <div>
                        <label className={labelClassName}>أبرز مهاراتك</label>
                        <input name="skills" required placeholder="Coding, Design..." value={formValues.skills ?? ""} onChange={(e) => updateField("skills", e.target.value)} className={`${fieldClassName} ${fieldErrors?.skills ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                        {fieldErrors?.skills && <p className="text-red-400 text-xs mt-1">{fieldErrors?.skills}</p>}
                    </div>
                    <div>
                        <label className={labelClassName}>بلد تود زيارته</label>
                        <input name="visitCountry" required placeholder="اليابان، دبي..." value={formValues.visitCountry ?? ""} onChange={(e) => updateField("visitCountry", e.target.value)} className={`${fieldClassName} ${fieldErrors?.visitCountry ? "border-rose-300/80 focus:border-rose-200/80 focus:ring-rose-200/45" : ""}`} />
                        {fieldErrors?.visitCountry && <p className="text-red-400 text-xs mt-1">{fieldErrors?.visitCountry}</p>}
                    </div>
                </div>
            </div>

            <div className="pt-4">
              <SubmitButton />
              <p className="mt-3 text-center text-xs text-cyan-50/65">يتم التعامل مع بياناتك بسرية تامة وتستخدم لأغراض تنظيمية فقط</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
