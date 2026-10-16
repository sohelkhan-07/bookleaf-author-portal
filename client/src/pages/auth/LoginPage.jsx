import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/useAuth";

export default function LoginPage({ audience = "author" }) {
  const isAdmin = audience === "admin";
  const role = isAdmin ? "admin" : "author";
  const { login, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
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
      await login(form, role);

      const destination = location.state?.from;
      const fallback = isAdmin
        ? "/admin/dashboard"
        : "/author/dashboard";
      const allowedPrefix = isAdmin ? "/admin/" : "/author/";

      navigate(
        destination?.startsWith(allowedPrefix) ? destination : fallback,
        { replace: true },
      );
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputLinkClass =
    "rounded-lg px-4 py-2 text-sm font-medium transition-colors";
  const activeLinkClass = "bg-white text-rose-600 shadow-sm";
  const inactiveLinkClass = "text-gray-500 hover:text-gray-900";

  return (
    <AuthLayout audience={audience}>
      <div className="w-full">
        <div className="mb-7">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-rose-600">
            WELCOME BACK
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {isAdmin ? "Admin sign in" : "Sign in to your account"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {isAdmin
              ? "Sign in with your existing administrator account."
              : "Pick up where you left off on your publishing journey."}
          </p>
        </div>

        <div
          className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1"
          aria-label="Choose account type"
        >
          <Link
            className={`${inputLinkClass} text-center ${
              !isAdmin ? activeLinkClass : inactiveLinkClass
            }`}
            to="/author/login"
            aria-current={!isAdmin ? "page" : undefined}
          >
            Author
          </Link>

          <Link
            className={`${inputLinkClass} text-center ${
              isAdmin ? activeLinkClass : inactiveLinkClass
            }`}
            to="/admin/login"
            aria-current={isAdmin ? "page" : undefined}
          >
            Admin
          </Link>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
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
            placeholder="Enter your password"
            autoComplete="current-password"
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
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {!isAdmin && (
          <p className="mt-6 text-center text-sm text-gray-500">
            New to BookLeaf?{" "}
            <Link
              className="font-semibold text-rose-600 hover:text-rose-700"
              to="/author/register"
            >
              Create an account
            </Link>
          </p>
        )}

        {isAdmin && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Author account?{" "}
            <Link
              className="font-semibold text-rose-600 hover:text-rose-700"
              to="/author/login"
            >
              Sign in as an author
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}