import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { fullName } from "../utils/format";
import { Logo } from "./Logo";
import { Avatar } from "./ui";

export function AppHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/dashboard" aria-label="PayTm home">
          <Logo />
        </Link>
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex items-center gap-3 rounded-full py-1 pr-3 pl-1 hover:bg-slate-100"
            >
              <Avatar firstName={user.firstName} lastName={user.lastName} size="h-9 w-9 text-xs" />
              <span className="hidden text-sm font-medium text-slate-700 sm:block">Hi, {user.firstName}</span>
            </button>
            {open && (
              <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">{fullName(user)}</p>
                  <p className="truncate text-xs text-slate-500">{user.username}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    logout();
                    navigate("/signin", { replace: true });
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
