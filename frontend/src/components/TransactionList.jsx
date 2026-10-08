import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate, formatINR, fullName } from "../utils/format";
import { Avatar } from "./ui";

export function TransactionList({ refreshKey = 0 }) {
  const [state, setState] = useState({ status: "loading", items: [], error: null });

  const load = useCallback(() => {
    let cancelled = false;
    api
      .transactions(10)
      .then((data) => !cancelled && setState({ status: "done", items: data.transactions, error: null }))
      .catch((err) => !cancelled && setState({ status: "error", items: [], error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load, refreshKey]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
      <div className="mt-3">
        {state.status === "loading" ? (
          <ul className="space-y-3" aria-label="Loading activity">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </ul>
        ) : state.status === "error" ? (
          <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {state.error}{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                setState((s) => ({ ...s, status: "loading" }));
                load();
              }}
            >
              Retry
            </button>
          </p>
        ) : state.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No transfers yet. Money you send or receive shows up here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {state.items.map((t) => {
              const sent = t.direction === "sent";
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <Avatar firstName={t.counterparty.firstName} lastName={t.counterparty.lastName} size="h-10 w-10 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {sent ? "To" : "From"} {fullName(t.counterparty)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(t.createdAt)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${sent ? "text-slate-900" : "text-emerald-600"}`}>
                    {sent ? "−" : "+"}
                    {formatINR(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
