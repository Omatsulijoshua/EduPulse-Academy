"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Lock,
  Loader2,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  DollarSign
} from "lucide-react";

interface CheckoutFormProps {
  feeId: string;
  studentId: string;
  feeTitle: string;
  feeAmount: number;
  studentName: string;
}

export default function CheckoutForm({
  feeId,
  studentId,
  feeTitle,
  feeAmount,
  studentName,
}: CheckoutFormProps) {
  const router = useRouter();
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    // Basic Card Validation Simulation
    const rawCard = cardNumber.replace(/\s+/g, "");
    if (rawCard.length !== 16) {
      setError("Invalid credit card number. Must be a 16-digit card.");
      setIsProcessing(false);
      return;
    }

    if (cvc.length < 3 || cvc.length > 4) {
      setError("Invalid CVC security code.");
      setIsProcessing(false);
      return;
    }

    try {
      // Simulate gateway delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const res = await fetch("/api/parent/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId, studentId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to process payment statement.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  if (isSuccess) {
    return (
      <div className="md:col-span-12 max-w-md w-full mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-100">Payment Succeeded!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tuition billing code is marked **PAID** on ClassNova ledgers. An audit log and transaction reference have been generated.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/parent")}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
        >
          <span>Return to Parent Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* LEFT COLUMN: Billing Summary (5 columns) */}
      <div className="md:col-span-5 space-y-6">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
          Invoice Statement details
        </span>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Billing Title</span>
            <h3 className="font-extrabold text-base text-slate-100 leading-tight">{feeTitle}</h3>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Student Candidate</span>
            <p className="font-bold text-slate-100 text-sm">{studentName}</p>
          </div>

          <div className="border-t border-slate-900 pt-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Amount Due</span>
              <span className="text-2xl font-extrabold text-slate-100 font-sans mt-0.5">${feeAmount.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-slate-900 border rounded-xl text-slate-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex gap-3 text-[10px] text-slate-500 font-medium leading-relaxed">
          <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0 mt-0.5" />
          <p>
            Your payment credentials are encrypted using 256-bit SSL tunnels. We support sandbox credit cards (e.g. Visa, MasterCard, Stripe Test).
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Card Details Form (7 columns) */}
      <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-primary" />
          <span>Stripe Credit Card Checkout</span>
        </h3>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 block">Name on Card</label>
            <input
              type="text"
              required
              placeholder="e.g. Robert Chen"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 block">Card Number</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
              />
              <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block">Expiry Date</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block">CVC Security Code</label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="***"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/gi, ""))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Processing Payment Gateway checkout...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ${feeAmount.toFixed(2)}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
