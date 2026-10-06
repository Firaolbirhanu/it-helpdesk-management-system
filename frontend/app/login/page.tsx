"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headphones,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await login(email.trim(), password);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      router.replace("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden bg-gray-900 p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <Headphones size={24} className="text-white" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-white">IT Help Desk</h1>
                <p className="text-xs text-gray-400">Support Management System</p>
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="text-sm font-medium text-blue-400">IT SUPPORT PLATFORM</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-white">
              Manage your IT support requests with confidence.
            </h2>
            <p className="mt-6 text-base leading-7 text-gray-400">
              Submit support tickets, track their progress, communicate with technicians,
              and get your technical issues resolved efficiently.
            </p>
          </div>

          <p className="text-xs text-gray-500">© 2026 IT Help Desk System</p>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <Headphones size={24} className="text-white" />
              </div>

              <div>
                <h1 className="font-bold text-gray-900">IT Help Desk</h1>
                <p className="text-xs text-gray-500">Support Management System</p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to access your support dashboard.
              </p>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  Email address
                </label>

                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>

                  <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Create account
              </Link>
            </p>

            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs leading-5 text-gray-500">
                Your account is protected by secure authentication. Access to system features
                depends on your assigned role and permissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
