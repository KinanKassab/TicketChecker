"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  agentCode: string;
  createOrderAction: (formData: FormData) => Promise<void>;
};

export default function RegistrationForm({ agentCode, createOrderAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // حالة للتحكم في أنيميشن الإغلاق
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // دالة التعامل مع الإغلاق لتشغيل الأنيميشن أولاً
  const handleClose = () => {
    setIsClosing(true);
    // ننتظر 300 ميلي ثانية (مدة الأنيميشن) قبل إخفاء المودال فعلياً
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 ${
        isClosing ? "animate-out fade-out opacity-0" : "animate-in fade-in opacity-100"
      }`}
      onClick={handleClose} // إغلاق عند الضغط في الخلفية
    >
      <div 
        className={`bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative transition-all duration-300 ${
          isClosing ? "animate-out zoom-out-95 scale-95" : "animate-in zoom-in-95 scale-100"
        }`}
        onClick={(e) => e.stopPropagation()} // منع الإغلاق عند الضغط داخل الفورم
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
           <div>
             <h2 className="text-xl font-bold text-slate-900">بيانات الحجز</h2>
             <p className="text-slate-500 text-xs mt-1">خطوة أخيرة لتأكيد انضمامك إلينا</p>
           </div>
           <button 
                onClick={handleClose}
                className="p-2 bg-white border border-gray-200 rounded-full hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 lg:p-8">
          <form action={createOrderAction} className="space-y-5">
            <input type="hidden" name="ref" value={agentCode} />

            {/* القسم الأول: المعلومات الشخصية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الثلاثي</label>
                <input name="fullName" required placeholder="مثال: محمد سامر العلي" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الميلاد</label>
                  <input type="date" name="dob" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">مكان الولادة</label>
                  <input name="pob" required placeholder="المحافظة" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الدراسة / التخصص</label>
                <input name="specialization" required placeholder="مثال: هندسة معلوماتية" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            {/* القسم الثاني: الطموح والشغف */}
            <div className="pt-6 border-t border-dashed border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <span className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    <p className="text-sm font-bold text-slate-900">شاركنا شغفك</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1.5">وظيفة تحلم بها</label>
                         <input name="dreamJob" required placeholder="مثال: Senior AI Engineer" className="w-full bg-blue-50/50 border border-blue-100 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-700 mb-1.5">شركة تنتمي لها</label>
                         <input name="company" required placeholder="مثال: Google, Tesla..." className="w-full bg-blue-50/50 border border-blue-100 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" />
                    </div>
                    
                    <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-700 mb-1.5">حلمك وطموحك المستقبلي</label>
                         <textarea name="dream" required rows={2} placeholder="اكتب باختصار..." className="w-full bg-blue-50/50 border border-blue-100 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 resize-none"></textarea>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">أبرز مهاراتك</label>
                        <input name="skills" required placeholder="Coding, Design..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">بلد تود زيارته</label>
                        <input name="visitCountry" required placeholder="اليابان، دبي..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            <div className="pt-4">
              <SubmitButton />
              <p className="text-center text-xs text-slate-400 mt-3">يتم التعامل مع بياناتك بسرية تامة وتستخدم لأغراض تنظيمية فقط</p>
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
        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        احجز مقعدك الآن
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
