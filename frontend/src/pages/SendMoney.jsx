import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppHeader } from "../components/AppHeader";
import { Alert, Avatar, Button, TextField } from "../components/ui";
import { formatINR, validateAmount } from "../utils/format";

const QUICK_AMOUNTS = [100, 500, 1000, 2000];
const OBJECT_ID = /^[a-f\d]{24}$/i;

export function SendMoney() {
  const [params] = useSearchParams();
  const to = params.get("to") ?? "";
  const name = (params.get("name") ?? "").trim() || "this user";
  const [firstName, ...rest] = name.split(" ");

  const { balance, setBalance } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  // Guards against double submission before React re-renders the disabled button.
  const inFlight = useRef(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    const problem = validateAmount(amount, balance);
    setAmountError(problem);
    setError(null);
    if (problem) return;

    inFlight.current = true;
    setSubmitting(true);
    try {
      const res = await api.transfer({ to, amount: Number(amount), note: note.trim() || undefined });
      setBalance(res.balance);
      setReceipt(res);
    } catch (err) {
      setError(err.message);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  let content;
  if (!OBJECT_ID.test(to)) {
    content = (
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900">No recipient selected</p>
        <p className="mt-1 text-sm text-slate-500">Pick someone from the dashboard to send money to.</p>
        <Link to="/dashboard" className="mt-6 inline-block font-semibold text-sky-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  } else if (receipt) {
    content = (
      <div className="text-center" role="status">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
        <p className="mt-4 text-sm text-slate-500">Sent successfully to {name}</p>
        <p className="mt-1 text-4xl font-bold text-slate-900">{formatINR(receipt.amount)}</p>
        <p className="mt-4 text-sm text-slate-500">New balance: {formatINR(receipt.balance)}</p>
        <p className="mt-1 font-mono text-xs text-slate-400">Ref {receipt.transactionId}</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/dashboard" className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90">
            Back to dashboard
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              setReceipt(null);
              setAmount("");
              setNote("");
            }}
          >
            Send again
          </Button>
        </div>
      </div>
    );
  } else {
    content = (
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar firstName={firstName} lastName={rest.join(" ")} size="h-14 w-14 text-lg" />
          <div>
            <p className="text-xs text-slate-500">Paying</p>
            <p className="text-lg font-semibold text-slate-900">{name}</p>
          </div>
        </div>

        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

        <TextField
          label="Amount (₹)"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          error={amountError}
          hint={balance != null ? `Available: ${formatINR(balance)}` : undefined}
          className="[&_input]:text-2xl [&_input]:font-semibold"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-sky hover:text-sky-700"
            >
              {formatINR(v).replace(".00", "")}
            </button>
          ))}
        </div>
        <TextField label="Note (optional)" placeholder="What's it for?" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} />

        <Button type="submit" variant="sky" loading={submitting} className="w-full py-3 text-base">
          {submitting ? "Sending…" : `Pay ${amount && !validateAmount(amount, null) ? formatINR(amount) : ""}`.trim()}
        </Button>
        <p className="text-center text-xs text-slate-400">Transfers are instant and cannot be undone.</p>
      </form>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-8">
        {!receipt && OBJECT_ID.test(to) && (
          <Link to="/dashboard" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">
            ← Back
          </Link>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{content}</div>
      </main>
    </div>
  );
}
