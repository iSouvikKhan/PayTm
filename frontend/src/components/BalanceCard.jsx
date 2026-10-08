import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { formatINR } from "../utils/format";
import { Spinner } from "./ui";

export function BalanceCard() {
  const { balance, refresh } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-[#0a4bb4] p-6 text-white shadow-lg">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sky/30 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-sky-100/80">Wallet balance</p>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" data-testid="balance">
            {balance === null ? <span className="inline-block h-9 w-40 animate-pulse rounded-lg bg-white/20" /> : formatINR(balance)}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-60"
        >
          {refreshing ? <Spinner className="h-3.5 w-3.5" /> : "↻"} Refresh
        </button>
      </div>
      {error && <p className="relative mt-3 text-xs text-rose-200">{error}</p>}
    </section>
  );
}
