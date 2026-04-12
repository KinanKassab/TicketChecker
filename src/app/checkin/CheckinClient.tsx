"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

type CheckinResponse =
  | {
      status: "success";
      attendeeName: string;
      ticketNumber: string;
    }
  | {
      status: "already_checked_in";
      attendeeName: string;
      ticketNumber: string;
      checkedInAt: string;
    }
  | { status: "error"; message: string };

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

function extractToken(input: string) {
  const raw = input.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const queryToken =
      url.searchParams.get("qrToken") ??
      url.searchParams.get("qr") ??
      url.searchParams.get("token") ??
      "";
    if (queryToken) return queryToken.trim();

    const segments = url.pathname.split("/").filter(Boolean);
    const lastSegment = segments.at(-1) ?? "";
    return lastSegment.trim() || raw;
  } catch {
    return raw;
  }
}

export default function CheckinClient() {
  const [ticketInput, setTicketInput] = useState("");
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scannerActiveRef = useRef(false);

  const stopScanner = () => {
    scannerActiveRef.current = false;

    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerOpen(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const submitCheckin = async (rawValue: string) => {
    const normalizedToken = extractToken(rawValue);
    if (!normalizedToken) {
      setResult({ status: "error", message: "رقم التذكرة مطلوب." });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: normalizedToken }),
      });
      const data = (await response.json()) as CheckinResponse;
      if (!response.ok) {
        setResult({
          status: "error",
          message: (data as { message?: string }).message ?? "رقم التذكرة غير صالح.",
        });
        return;
      }
      setResult(data);
      setTicketInput("");
    } catch {
      setResult({ status: "error", message: "تعذر تنفيذ عملية تسجيل الدخول." });
    } finally {
      setLoading(false);
    }
  };

  const runScanLoop = async () => {
    if (!scannerActiveRef.current || !videoRef.current || !detectorRef.current) {
      return;
    }

    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      const scannedValue = codes.find((item) => item.rawValue?.trim())?.rawValue ?? "";

      if (scannedValue) {
        const extracted = extractToken(scannedValue);
        if (extracted) {
          setTicketInput(extracted);
          setScannerMessage("تمت قراءة التذكرة. جاري التحقق...");
          stopScanner();
          await submitCheckin(extracted);
          return;
        }
      }
    } catch {
      // Keep trying until camera closes or a code is found.
    }

    scanTimerRef.current = window.setTimeout(() => {
      void runScanLoop();
    }, 250);
  };

  const startScanner = async () => {
    if (loading) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerMessage("هذا المتصفح لا يدعم الوصول إلى الكاميرا.");
      return;
    }

    const BarcodeDetectorImpl = (
      window as Window & { BarcodeDetector?: BarcodeDetectorCtor }
    ).BarcodeDetector;

    if (!BarcodeDetectorImpl) {
      setScannerMessage("ميزة المسح بالكاميرا غير مدعومة في هذا المتصفح.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      detectorRef.current = new BarcodeDetectorImpl({ formats: ["qr_code"] });
      scannerActiveRef.current = true;
      setScannerOpen(true);
      setScannerMessage("وجّه الكاميرا نحو رمز التذكرة.");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      void runScanLoop();
    } catch {
      stopScanner();
      setScannerMessage("تعذر الوصول إلى الكاميرا. تأكد من صلاحيات المتصفح.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitCheckin(ticketInput);
  };

  const resultContainerClass =
    result?.status === "success"
      ? "border-emerald-200/90 bg-emerald-50/85"
      : result?.status === "already_checked_in"
        ? "border-amber-200/90 bg-amber-50/90"
        : "border-rose-200/90 bg-rose-50/90";

  return (
    <div className="rounded-[2rem] border border-white/35 bg-white/20 p-6 shadow-[0_18px_50px_rgba(16,39,78,0.28)] backdrop-blur-xl md:p-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">تسجيل الدخول</h1>
      <p className="mt-2 text-sm text-slate-700/90">
        أدخل رقم التذكرة أو قم بمسحها مباشرة بالكاميرا.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <input
          className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-slate-500 focus:border-[#2f74c3] focus:ring-2 focus:ring-[#2f74c3]/20"
          value={ticketInput}
          onChange={(event) => setTicketInput(event.target.value)}
          placeholder="رقم التذكرة أو رابط التذكرة"
          required
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              if (scannerOpen) {
                stopScanner();
                setScannerMessage("تم إيقاف الكاميرا.");
                return;
              }
              void startScanner();
            }}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/90 disabled:opacity-60"
          >
            {scannerOpen ? "إيقاف الكاميرا" : "المسح بالكاميرا"}
          </button>
          <p className="text-xs text-slate-700/80">
            يدعم رقم التذكرة المباشر أو رابط التذكرة.
          </p>
        </div>

        {scannerOpen ? (
          <div className="overflow-hidden rounded-2xl border border-white/60 bg-black/90 shadow-[0_10px_35px_rgba(9,21,48,0.35)]">
            <video
              ref={videoRef}
              className="h-64 w-full object-cover sm:h-72"
              autoPlay
              muted
              playsInline
            />
          </div>
        ) : null}

        {scannerMessage ? (
          <p className="rounded-xl border border-rose-200/90 bg-rose-50/90 px-3 py-2 text-xs font-semibold text-rose-700">
            {scannerMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#0f2850] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(15,40,80,0.35)] transition hover:bg-[#153567] disabled:opacity-60"
        >
          تسجيل الدخول
        </button>
      </form>

      {result ? (
        <div className={`mt-6 rounded-2xl border p-4 text-sm ${resultContainerClass}`}>
          {result.status === "success" ? (
            <p className="font-semibold text-emerald-800">
              تم تسجيل الدخول: {result.attendeeName} — {result.ticketNumber}
            </p>
          ) : null}
          {result.status === "already_checked_in" ? (
            <p className="font-semibold text-amber-800">
              تم تسجيل الدخول مسبقاً في {result.checkedInAt}: {result.attendeeName}{" "}
              — {result.ticketNumber}
            </p>
          ) : null}
          {result.status === "error" ? (
            <p className="font-semibold text-rose-800">{result.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
