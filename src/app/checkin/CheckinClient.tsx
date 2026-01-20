"use client";

import type { FormEvent } from "react";
import { useState } from "react";

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

export default function CheckinClient() {
  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken }),
      });
      const data = (await response.json()) as CheckinResponse;
      if (!response.ok) {
        setResult({
          status: "error",
          message: (data as { message?: string }).message ?? "Invalid token.",
        });
        return;
      }
      setResult(data);
      setQrToken("");
    } catch (error) {
      setResult({ status: "error", message: "Unable to check in." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Check-in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Paste or scan the QR token from the ticket.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          value={qrToken}
          onChange={(event) => setQrToken(event.target.value)}
          placeholder="QR token"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Check in
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {result.status === "success" ? (
            <p className="text-emerald-700">
              Checked in: {result.attendeeName} — {result.ticketNumber}
            </p>
          ) : null}
          {result.status === "already_checked_in" ? (
            <p className="text-amber-700">
              Already checked in at {result.checkedInAt}: {result.attendeeName}{" "}
              — {result.ticketNumber}
            </p>
          ) : null}
          {result.status === "error" ? (
            <p className="text-rose-700">{result.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
