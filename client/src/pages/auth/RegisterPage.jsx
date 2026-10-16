import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/useAuth";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  city: "",
};

export default function RegisterPage() {
  const { register, session } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session?.user) {
    return (
      <Navigate
        to={
          session.user.role === "admin"
            ? "/admin/dashboard"
            : "/author/dashboard"
        }
        replace
      />
    );
  }

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        ...(form.city.trim() && { city: form.city.trim() }),
      });

      navigate("/author/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout audience="author">
      <div className="w-full">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-rose-600">
            GET STARTED
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Create your author account
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Register to manage your books and support requests.
          </p>
        </div>

        <div
          className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1"
          aria-label="Choose account type"
        >
          <Link
            className="rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-rose-600 shadow-sm"
            to="/author/register"
            aria-current="page"
          >
            Author
          </Link>

          <Link
            className="rounded-lg px-4 py-2 text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            to="/admin/login"
          >
            Admin
          </Link>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormField
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            autoComplete="name"
            minLength={2}
          />

          <FormField
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
          />

          <FormField
            label="Phone (optional)"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
            autoComplete="tel"
            required={false}
          />

          <FormField
            label="City (optional)"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Your city"
            autoComplete="address-level2"
            required={false}
          />

          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  size={18}
                  aria-hidden="true"
                />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link
            className="font-semibold text-rose-600 hover:text-rose-700"
            to="/author/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}