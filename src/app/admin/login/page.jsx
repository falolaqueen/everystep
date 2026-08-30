"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        console.error("Supabase login error:", error);
        setError(error.message);
        return;
      }

      if (!data?.user) {
        setError("Login was not completed. Please try again.");
        return;
      }

      // Make sure the logged-in user is actually an Every Step admin.
      const { data: admin, error: adminError } =
        await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

      if (adminError) {
        console.error(
          "Admin verification error:",
          adminError
        );

        setError(
          "We couldn't verify your admin account."
        );

        await supabase.auth.signOut();

        return;
      }

      if (!admin) {
        await supabase.auth.signOut();

        setError(
          "This account does not have Every Step admin access."
        );

        return;
      }

      // Successful admin login.
      router.replace("/admin");
      router.refresh();

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.message ||
          "Something went wrong while logging in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f2] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d97745]">
            Every Step
          </p>

          <h1 className="mt-3 text-4xl font-black text-[#2b1b14]">
            Welcome back 🧡
          </h1>

          <p className="mt-3 text-[#80695d]">
            Sign in to manage your footwear store.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-[2rem] border border-[#f0d8c6] bg-white p-7 shadow-xl shadow-[#d97745]/10"
        >

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#3a2921]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-[#ead5c5] bg-[#fffaf6] px-4 py-3.5 outline-none transition focus:border-[#d97745] focus:ring-4 focus:ring-[#d97745]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#3a2921]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-[#ead5c5] bg-[#fffaf6] px-4 py-3.5 outline-none transition focus:border-[#d97745] focus:ring-4 focus:ring-[#d97745]/10"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-2xl bg-[#d97745] px-5 py-4 font-bold text-white shadow-lg shadow-[#d97745]/20 transition hover:-translate-y-0.5 hover:bg-[#c96838] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing you in..."
              : "Enter Every Step →"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-[#9a8173]">
          Admin access only · Every Step
        </p>

      </div>
    </main>
  );
}