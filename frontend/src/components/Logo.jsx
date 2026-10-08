export function Logo({ className = "", light = false }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="6" width="18" height="13" rx="3" />
          <path d="M3 10h18M16 14.5h2" strokeLinecap="round" />
        </svg>
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}>
        Pay<span className="text-sky">Tm</span>
      </span>
    </span>
  );
}
