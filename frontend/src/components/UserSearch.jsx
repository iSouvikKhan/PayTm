import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api/client";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { fullName } from "../utils/format";
import { Avatar, Button } from "./ui";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const [state, setState] = useState({ status: "loading", users: [], error: null });
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    api
      .searchUsers(debounced.trim(), controller.signal)
      .then((data) => setState({ status: "done", users: data.users, error: null }))
      .catch((err) => {
        if (err.name !== "AbortError") setState({ status: "error", users: [], error: err.message });
      });
    // Aborting stale requests keeps out-of-order responses from overwriting newer results.
    return () => controller.abort();
  }, [debounced, attempt]);

  const searching = state.status === "loading" || query !== debounced;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Send money</h2>
        {searching && <span className="text-xs text-slate-400">Searching…</span>}
      </div>
      <div className="relative mt-3">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          value={query}
          maxLength={50}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
          className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pr-3 pl-9 text-sm focus:border-sky focus:bg-white focus:ring-4 focus:ring-sky/20 focus:outline-none"
        />
      </div>

      <div className="mt-4">
        {state.status === "loading" && state.users.length === 0 ? (
          <ul className="space-y-3" aria-label="Loading users">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
                <span className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              </li>
            ))}
          </ul>
        ) : state.status === "error" ? (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {state.error}{" "}
            <button type="button" className="font-semibold underline" onClick={() => setAttempt((a) => a + 1)}>
              Retry
            </button>
          </div>
        ) : state.users.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            {debounced.trim() ? `No users match “${debounced.trim()}”.` : "No other users yet. Invite a friend to sign up!"}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {state.users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar firstName={u.firstName} lastName={u.lastName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{fullName(u)}</p>
                    <p className="truncate text-xs text-slate-500">{u.username}</p>
                  </div>
                </div>
                <Button
                  variant="sky"
                  className="shrink-0 px-3 py-2 text-xs"
                  onClick={() =>
                    navigate(`/send?to=${encodeURIComponent(u.id)}&name=${encodeURIComponent(fullName(u))}`)
                  }
                >
                  Send
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
