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
      className={`fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md transition-all duration-300 ${
        isClosing ? "animate-out fade-out opacity-0" : "animate-in fade-in opacity-100"
      }`}
      onClick={handleClose} // إغلاق عند الضغط في الخلفية
    >
      <div 
        className={`liquid-glass-strong rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative transition-all duration-300 ${
          isClosing ? "animate-out zoom-out-95 scale-95" : "animate-in zoom-in-95 scale-100"
        }`}
        style={{ overflowY: "auto", overflowX: "hidden" }}
        onClick={(e) => e.stopPropagation()} // منع الإغلاق عند الضغط داخل الفورم
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-slate-900/30 sticky top-0 z-10 backdrop-blur-xl">
           <div>
             <h2 className="text-xl font-black text-white">بيانات الحجز</h2>
             <p className="text-white/70 text-xs mt-1">خطوة أخيرة لتأكيد انضمامك إلينا</p>
           </div>
           <button 
                onClick={handleClose}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/80 hover:bg-red-500/20 hover:border-red-300/40 hover:text-white transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 lg:p-8">
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="ref" value={agentCode} />

            {state?.ok === false && (
              <div className="rounded-xl bg-red-500/20 border border-red-400/40 px-4 py-3 text-red-200 text-sm space-y-1">
                <p className="font-medium">{state.error}</p>
                {fieldErrors && Object.keys(fieldErrors).length > 0 && (
                  <ul className="list-disc list-inside mt-2 text-red-300/90">
                    {Object.entries(fieldErrors).map(([field, msg]) => (
                      <li key={field}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* القسم الأول: المعلومات الشخصية */}
            <div className="liquid-glass-subtle rounded-2xl p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-white/85 mb-1.5">الاسم الثلاثي</label>
                <input name="fullName" required placeholder="مثال: محمد سامر العلي" value={formValues.fullName ?? ""} onChange={(e) => updateField("fullName", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none transition-all ${fieldErrors?.fullName ? "border-red-400/60" : "border-white/25"}`} />
                {fieldErrors?.fullName && <p className="text-red-400 text-xs mt-1">{fieldErrors?.fullName}</p>}
              </div>

              <div>
                  <label className="block text-xs font-bold text-white/85 mb-1.5">تاريخ الميلاد</label>
                  <input type="date" name="dob" required value={formValues.dob ?? ""} onChange={(e) => updateField("dob", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none ${fieldErrors?.dob ? "border-red-400/60" : "border-white/25"}`} />
                  {fieldErrors?.dob && <p className="text-red-400 text-xs mt-1">{fieldErrors?.dob}</p>}
              </div>
              <div>
                  <label className="block text-xs font-bold text-white/85 mb-1.5">مكان الولادة</label>
                  <input name="pob" required placeholder="المحافظة" value={formValues.pob ?? ""} onChange={(e) => updateField("pob", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none ${fieldErrors?.pob ? "border-red-400/60" : "border-white/25"}`} />
                  {fieldErrors?.pob && <p className="text-red-400 text-xs mt-1">{fieldErrors?.pob}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-white/85 mb-1.5">الدراسة / التخصص</label>
                <input name="specialization" required placeholder="مثال: هندسة معلوماتية" value={formValues.specialization ?? ""} onChange={(e) => updateField("specialization", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none ${fieldErrors?.specialization ? "border-red-400/60" : "border-white/25"}`} />
                {fieldErrors?.specialization && <p className="text-red-400 text-xs mt-1">{fieldErrors?.specialization}</p>}
              </div>
            </div>

            {/* القسم الثاني: الطموح والشغف */}
            <div className="liquid-glass-subtle rounded-2xl p-5 md:p-6 border border-white/15">
                <div className="flex items-center gap-2 mb-4">
                    <span className="p-1.5 bg-[#27aae2]/25 text-[#b4e237] rounded-md border border-white/15">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    <p className="text-sm font-bold text-white">شاركنا شغفك</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-xs font-bold text-white/85 mb-1.5">وظيفة تحلم بها</label>
                         <input name="dreamJob" required placeholder="مثال: Senior AI Engineer" value={formValues.dreamJob ?? ""} onChange={(e) => updateField("dreamJob", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none ${fieldErrors?.dreamJob ? "border-red-400/60" : "border-white/25"}`} />
                         {fieldErrors?.dreamJob && <p className="text-red-400 text-xs mt-1">{fieldErrors?.dreamJob}</p>}
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-white/85 mb-1.5">شركة تنتمي لها</label>
                         <input name="company" required placeholder="مثال: Google, Tesla..." value={formValues.company ?? ""} onChange={(e) => updateField("company", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none ${fieldErrors?.company ? "border-red-400/60" : "border-white/25"}`} />
                         {fieldErrors?.company && <p className="text-red-400 text-xs mt-1">{fieldErrors?.company}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-white/85 mb-1.5">حلمك وطموحك المستقبلي</label>
                         <textarea name="dream" required rows={2} placeholder="اكتب باختصار..." value={formValues.dream ?? ""} onChange={(e) => updateField("dream", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none resize-none ${fieldErrors?.dream ? "border-red-400/60" : "border-white/25"}`}></textarea>
                         {fieldErrors?.dream && <p className="text-red-400 text-xs mt-1">{fieldErrors?.dream}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-white/85 mb-1.5">أبرز مهاراتك</label>
                        <input name="skills" required placeholder="Coding, Design..." value={formValues.skills ?? ""} onChange={(e) => updateField("skills", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none ${fieldErrors?.skills ? "border-red-400/60" : "border-white/25"}`} />
                        {fieldErrors?.skills && <p className="text-red-400 text-xs mt-1">{fieldErrors?.skills}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/85 mb-1.5">بلد تود زيارته</label>
                        <input name="visitCountry" required placeholder="اليابان، دبي..." value={formValues.visitCountry ?? ""} onChange={(e) => updateField("visitCountry", e.target.value)} className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder:text-white/55 focus:ring-2 focus:ring-[#b4e237] focus:border-[#b4e237]/60 outline-none ${fieldErrors?.visitCountry ? "border-red-400/60" : "border-white/25"}`} />
                        {fieldErrors?.visitCountry && <p className="text-red-400 text-xs mt-1">{fieldErrors?.visitCountry}</p>}
                    </div>
                </div>
            </div>

            <div className="pt-4">
              <SubmitButton />
              <p className="text-center text-xs text-white/60 mt-3">يتم التعامل مع بياناتك بسرية تامة وتستخدم لأغراض تنظيمية فقط</p>
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
