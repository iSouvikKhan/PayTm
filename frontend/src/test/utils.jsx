import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";
import { AuthProvider } from "../auth/AuthContext";

/** Mocks fetch with a handler (method, path, body) => [status, json]. */
export function mockFetch(handler) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init = {}) => {
    const path = String(url).replace(/^.*\/api\/v1/, "");
    const body = init.body ? JSON.parse(init.body) : undefined;
    const [status, json] = await handler(init.method ?? "GET", path, body, init);
    return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
  });
}

export function renderAt(path, routes) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {routes.map(([p, el]) => (
            <Route key={p} path={p} element={el} />
          ))}
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}
