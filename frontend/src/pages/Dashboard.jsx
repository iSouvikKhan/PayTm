import { useAuth } from "../auth/AuthContext";
import { AppHeader } from "../components/AppHeader";
import { BalanceCard } from "../components/BalanceCard";
import { TransactionList } from "../components/TransactionList";
import { UserSearch } from "../components/UserSearch";

export function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hello, {user?.firstName ?? "there"} 👋</h1>
          <p className="text-sm text-slate-500">Send money to anyone on PayTm instantly.</p>
        </div>
        <BalanceCard />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <UserSearch />
          </div>
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
        </div>
      </main>
    </div>
  );
}
