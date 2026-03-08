"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="liquid-glass-button liquid-glass-button-lg w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "جاري التحضير..." : "ادفع الآن"}
    </button>
  );
} 