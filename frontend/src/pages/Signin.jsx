import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { api, fieldErrors } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Alert, Button, TextField } from "../components/ui";

export function Signin() {
  const { startSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.username.trim()) next.username = "Enter your email";
    if (!form.password) next.password = "Enter your password";
    setErrors(next);
    setError(null);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const data = await api.signin({ username: form.username.trim(), password: form.password });
      startSession(data);
      navigate(location.state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your wallet"
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-semibold text-sky-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.username}
          onChange={update("username")}
          error={errors.username}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
