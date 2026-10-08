import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "../components/ui";
import { useAuth } from "./AuthContext";

function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50">
      <Spinner className="h-8 w-8 text-sky-600" />
    </div>
  );
}

/** Pages that need a signed-in user. */
export function RequireAuth() {
  const { token, status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullPageSpinner />;
  if (!token) return <Navigate to="/signin" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Sign-in and sign-up pages: signed-in users go to the dashboard. */
export function GuestOnly() {
  const { token, status } = useAuth();
  if (status === "loading") return <FullPageSpinner />;
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
