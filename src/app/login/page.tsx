"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) router.push("/kasir");
    else setErr("Username atau password salah");
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border bg-[var(--surface)] p-8"
        style={{ borderColor: "var(--line)" }}
      >
        <h1 className="mb-6 text-xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
          Masuk POS
        </h1>

        <label className="mb-1 block text-sm" style={{ color: "var(--muted)" }}>
          Username
        </label>
        <input
          value={username}
          onChange={(e) => setU(e.target.value)}
          autoComplete="username"
          className="mb-4 w-full rounded border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface)" }}
        />

        <label className="mb-1 block text-sm" style={{ color: "var(--muted)" }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setP(e.target.value)}
          autoComplete="current-password"
          className="mb-4 w-full rounded border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface)" }}
        />

        {err && (
          <p className="mb-4 text-sm" style={{ color: "#c0392b" }}>
            {err}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded py-2 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
