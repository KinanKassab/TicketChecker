"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-cyan-100/55 bg-linear-to-r from-cyan-300/30 via-sky-300/26 to-lime-300/22 px-6 py-3.5 text-base font-black tracking-wide text-white shadow-[0_14px_36px_rgba(12,62,110,0.36),inset_0_1px_0_rgba(255,255,255,0.36)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-100/80 hover:from-cyan-200/40 hover:via-sky-200/34 hover:to-lime-200/30 hover:shadow-[0_18px_42px_rgba(18,86,148,0.42),inset_0_1px_0_rgba(255,255,255,0.46)] active:translate-y-0 active:scale-[0.995] disabled:translate-y-0 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "جاري التحضير..." : "ادفع الآن"}
    </button>
  );
} 