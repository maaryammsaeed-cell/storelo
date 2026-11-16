"use client";

import { useState } from "react";

const OUTCOMES = [
  ["success", "Success (41)"],
  ["fail", "Fail (42)"],
  ["cancel", "Cancel (44)"],
  ["pending", "Pending (43)"],
  ["duplicate", "Duplicate (48)"],
];

export default function PaymentTestPage() {
  const [paymentId, setPaymentId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState("");

  async function run(outcome) {
    if (!paymentId.trim()) {
      setResult({ error: "Pehle payment id dalo." });
      return;
    }

    setLoading(outcome);
    setResult(null);

    try {
      const response = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentId.trim(),
          outcome,
        }),
      });

      setResult(await response.json());
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading("");
    }
  }

  async function expire() {
    setLoading("expire");
    setResult(null);

    try {
      const response = await fetch("/api/payments/expire", {
        method: "POST",
      });
      setResult(await response.json());
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Payment Test Panel</h1>
      <p className="mt-2 text-sm text-gray-500">
        Sirf testing ke liye. Demo ke baad delete kar dena.
      </p>

      <label className="mt-6 block text-sm font-medium">
        Payment ID
      </label>

      <input
        value={paymentId}
        onChange={(e) => setPaymentId(e.target.value)}
        placeholder="pay_..."
        className="mt-2 w-full rounded border px-3 py-2 text-sm"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {OUTCOMES.map(([outcome, label]) => (
          <button
            key={outcome}
            onClick={() => run(outcome)}
            disabled={Boolean(loading)}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading === outcome ? "..." : label}
          </button>
        ))}

        <button
          onClick={expire}
          disabled={Boolean(loading)}
          className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading === "expire" ? "..." : "Expiry Sweeper (45)"}
        </button>
      </div>

      <pre className="mt-6 overflow-auto rounded bg-gray-100 p-4 text-xs">
        {result
          ? JSON.stringify(result, null, 2)
          : "Result yahan aayega..."}
      </pre>
    </main>
  );
}