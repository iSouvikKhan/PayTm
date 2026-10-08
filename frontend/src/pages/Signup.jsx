import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, fieldErrors } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Alert, Button, TextField } from "../components/ui";
import { validateSignup } from "../utils/validation";

export function Signup() {
  const { startSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = validateSignup(form);
    setErrors(next);
    setError(null);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const data = await api.signup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      startSession(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your wallet"
      subtitle="New accounts start with a random demo balance"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-sky-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} error={errors.firstName} maxLength={50} />
          <TextField label="Last name" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} error={errors.lastName} maxLength={50} />
        </div>
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
          autoComplete="new-password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          hint="At least 8 characters"
        />
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
