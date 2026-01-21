"use client";

import { useState } from "react";

type ConfirmPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  verificationCode: string | null;
  orderReferenceCode: string;
};

export default function ConfirmPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  verificationCode,
  orderReferenceCode,
}: ConfirmPaymentModalProps) {
  const [enteredCode, setEnteredCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!verificationCode) {
      setError("لا يوجد رقم مدخل للتحقق منه");
      return;
    }

    if (enteredCode.trim() !== verificationCode.trim()) {
      setError("الرقم المدخل غير صحيح. يرجى التحقق من الرقم.");
      return;
    }

    setError(null);
    onConfirm();
  };

  const handleClose = () => {
    setEnteredCode("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
          تأكيد الدفع
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          يرجى إدخال الرقم الذي تم إدخاله مسبقاً للتحقق من صحة الدفع:
        </p>
        
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 block mb-2">
            الرقم المدخل:
          </label>
          <input
            type="text"
            value={enteredCode}
            onChange={(e) => {
              setEnteredCode(e.target.value);
              setError(null);
            }}
            placeholder="أدخل الرقم للتحقق"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono"
            maxLength={20}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
          />
          {verificationCode && (
            <p className="mt-2 text-xs text-slate-500">
              رقم الطلب: <span className="font-mono">{orderReferenceCode}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!enteredCode.trim()}
            className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}
