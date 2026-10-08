import { Link } from "react-router";
import { Logo } from "../components/Logo";

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo />
      <p className="mt-10 text-6xl font-extrabold text-navy">404</p>
      <p className="mt-2 text-slate-600">This page does not exist.</p>
      <Link to="/" className="mt-6 font-semibold text-sky-700 hover:underline">
        Go home
      </Link>
    </div>
  );
}
