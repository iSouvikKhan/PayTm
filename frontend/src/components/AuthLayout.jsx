import { Logo } from "./Logo";

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh bg-slate-50 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <div>
          <h2 className="text-4xl leading-tight font-bold">
            Send money to friends
            <br />
            in seconds.
          </h2>
          <p className="mt-4 max-w-sm text-sky-100/80">
            A simple wallet with instant transfers. Every transfer runs inside a database transaction, so your balance
            is always correct.
          </p>
        </div>
        <p className="text-xs text-sky-100/60">Demo app. Balances are simulated.</p>
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-sky/30 blur-2xl" />
        <div className="pointer-events-none absolute top-24 -right-10 h-40 w-40 rounded-full bg-sky/20 blur-xl" />
      </aside>

      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Logo className="mb-8 lg:hidden" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
        </div>
      </main>
    </div>
  );
}
