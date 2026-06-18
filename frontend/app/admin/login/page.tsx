"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { loginAdmin } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@events.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await loginAdmin(email, password);
      window.localStorage.setItem("event-discovery-admin-token", response.accessToken);
      router.push("/admin/dashboard");
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20"
      >
        <p className="text-sm font-medium text-cyan-300">Admin access</p>
        <h1 className="mt-2 text-3xl font-bold">Login to the dashboard</h1>
        <div className="mt-8 space-y-4">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm outline-none"
            placeholder="Email"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm outline-none"
            placeholder="Password"
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-cyan-400 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </form>
    </main>
  );
}
