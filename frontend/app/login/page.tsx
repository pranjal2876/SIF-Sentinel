"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const DEMO_ACCOUNTS = [
  {
    username: "safety.manager",
    role: "Safety Manager",
    title: "Corporate HSE",
    icon: "admin_panel_settings",
  },
  {
    username: "site.officer",
    role: "Site Safety Officer",
    title: "Field Operations",
    icon: "security",
  },
  {
    username: "admin",
    role: "Administrator",
    title: "System Admin",
    icon: "manage_accounts",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("safety.manager");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username, password);
      localStorage.setItem("sif_token", res.access_token);
      localStorage.setItem("sif_role", res.role);
      localStorage.setItem("sif_username", res.username);
      router.push("/dashboard");
    } catch {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPersona(account: (typeof DEMO_ACCOUNTS)[0]) {
    setUsername(account.username);
    setPassword("demo1234");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Column: Enterprise Hero Branding */}
      <div className="lg:w-1/2 bg-[#0F172A] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <span className="material-symbols-outlined text-2xl font-bold">shield</span>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block">
                SIF SENTINEL
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block -mt-0.5">
                AI Safety Intelligence Platform
              </span>
            </div>
          </div>
        </div>

        {/* Central Mission Statement & Features */}
        <div className="relative z-10 py-12 lg:py-0 my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Empowering Zero-Harm Operations
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Predictive Precursor Detection &amp; Multi-Barrier Intelligence
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed mb-8">
            Transform low-signal near-miss observations and high-frequency well telemetry into proactive risk interventions before serious incidents occur.
          </p>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </div>
              <div>
                <span className="font-bold text-white block">Deterministic 5-Factor SIF Engine</span>
                <span className="text-slate-400">
                  Calculated against Barrier Failure, Exposure, Severity, and Recurrence without black-box opacity.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">timeline</span>
              </div>
              <div>
                <span className="font-bold text-white block">Offshore Multi-Sensor Telemetry</span>
                <span className="text-slate-400">
                  Continuous classification of 10 operational well states using Petrobras 3W benchmark models.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
              </div>
              <div>
                <span className="font-bold text-white block">Human-in-the-Loop Active Learning</span>
                <span className="text-slate-400">
                  HSE experts review and calibrate models with retraining feedback loops and life-saving rule alignment.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800 pt-4">
          <span>Aligned with IOGP 2024 &amp; OSHA Guidelines</span>
          <span>Version 2.4.0-Enterprise</span>
        </div>
      </div>

      {/* Right Column: Sign In Portal */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Enterprise Sign In
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Access your organization&apos;s real-time safety command center
              </p>
            </div>

            {/* Quick Demo Persona Selector */}
            <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Demo Persona
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">1-Click Auto-Fill</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = username === acc.username;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleSelectPersona(acc)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs"
                          : "bg-white border-slate-200/80 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-blue-600 mb-1">
                        {acc.icon}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold leading-tight">{acc.role}</p>
                        <p className="text-[9px] text-slate-400">{acc.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white text-slate-900"
                    placeholder="safety.manager"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">
                    lock
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
                  {loading ? "progress_activity" : "login"}
                </span>
                {loading ? "Authenticating Session..." : "SIGN IN TO SENTINEL"}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Default Demo Password: <strong>demo1234</strong></span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                API Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
