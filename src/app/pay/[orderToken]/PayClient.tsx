"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSyp } from "@/lib/format";

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
  const [phone, setPhone] = useState(order.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const instructionsReady = Boolean(currentOrder.method && currentOrder.phone);

  const merchantNumber = useMemo(() => {
    if (currentOrder.method === "SYRIATEL") return merchantNumbers.syriatel;
    if (currentOrder.method === "MTN") return merchantNumbers.mtn;
    return null;
  }, [currentOrder.method, merchantNumbers.mtn, merchantNumbers.syriatel]);

  const refreshStatus = async () => {
    const response = await fetch(`/api/orders/${currentOrder.orderToken}/status`);
    if (!response.ok) return;
    const data = (await response.json()) as OrderView;
    setCurrentOrder((prev) => ({ ...prev, ...data }));
  };

  const onSaveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/orders/${currentOrder.orderToken}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method, phone }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error ?? "Unable to save details.");
        return;
      }
      setCurrentOrder(data);
      setMessage("Payment details saved.");
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
      <h1 className="text-2xl font-semibold text-slate-900">Pay for your ticket</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your order is currently <strong>{currentOrder.status}</strong>.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={onSaveDetails}>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Payment method
          </label>
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={method ?? ""}
            onChange={(event) =>
              setMethod(event.target.value as OrderView["method"])
            }
            required
          >
            <option value="" disabled>
              Choose method
            </option>
            <option value="SYRIATEL">Syriatel Cash</option>
            <option value="MTN">MTN Cash</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Phone number
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="09XXXXXXXX"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Save payment details
        </button>
      </form>

      {instructionsReady && merchantNumber ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Payment instructions
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>
              Amount: <strong>{formatSyp(currentOrder.amount)}</strong>
            </li>
            <li>
              Merchant wallet number: <strong>{merchantNumber}</strong>
            </li>
            <li>
              Reference code: <strong>{currentOrder.referenceCode}</strong>
            </li>
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Pay using Syriatel Cash / MTN Cash app or USSD, include the reference
            code in the note if possible.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            ⓘ After payment, your order will be confirmed manually by admin. This page will automatically update once confirmed.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={checkPayment}
            className="mt-4 w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
          >
            {loading ? "Checking..." : "I have paid"}
          </button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-600">
          Complete step A to view payment instructions.
        </p>
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
    </div>
  );
}
