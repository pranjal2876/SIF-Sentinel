"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChange?: (username: string, role: string) => void;
}

const PERSONAS = [
  {
    username: "safety.manager",
    name: "Safety Manager",
    role: "Corporate HSE Manager",
    email: "safety.manager@sifsentinel.internal",
    facility: "Corporate HSE / All Facilities",
    icon: "admin_panel_settings",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    username: "site.officer",
    name: "Site Safety Officer",
    role: "Field Operations Officer",
    email: "site.officer@sifsentinel.internal",
    facility: "Site Alpha & Offshore-3",
    icon: "security",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    username: "admin",
    name: "System Administrator",
    role: "Platform Administrator",
    email: "admin@sifsentinel.internal",
    facility: "Global Operations",
    icon: "manage_accounts",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export function ProfileSettingsModal({
  isOpen,
  onClose,
  onUserChange,
}: ProfileSettingsModalProps) {
  const router = useRouter();
  const [activeUsername, setActiveUsername] = useState("safety.manager");
  const [activeRole, setActiveRole] = useState("Safety Manager");
  const [activeName, setActiveName] = useState("Safety Manager");
  const [activeEmail, setActiveEmail] = useState("safety.manager@sifsentinel.internal");
  const [activeFacility, setActiveFacility] = useState("Corporate HSE / All Facilities");

  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [telemetryAlerts, setTelemetryAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("sif_username") || "safety.manager";
      const storedRole = localStorage.getItem("sif_role") || "manager";
      setActiveUsername(storedUser);

      const matched = PERSONAS.find(
        (p) => p.username === storedUser || p.username.toLowerCase() === storedUser.toLowerCase()
      );
      if (matched) {
        setActiveName(matched.name);
        setActiveRole(matched.role);
        setActiveEmail(matched.email);
        setActiveFacility(matched.facility);
      } else {
        setActiveName(storedUser.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "));
        setActiveRole(storedRole.toUpperCase());
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSwitchPersona(persona: (typeof PERSONAS)[0]) {
    setSwitching(true);
    setSuccessMsg(null);
    try {
      const res = await api.login(persona.username, "demo1234");
      localStorage.setItem("sif_token", res.access_token);
      localStorage.setItem("sif_role", res.role);
      localStorage.setItem("sif_username", res.username);

      setActiveUsername(persona.username);
      setActiveName(persona.name);
      setActiveRole(persona.role);
      setActiveEmail(persona.email);
      setActiveFacility(persona.facility);

      if (onUserChange) {
        onUserChange(persona.name, persona.role);
      }

      setSuccessMsg(`Active persona switched to ${persona.name}. Session refreshed.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
        router.refresh();
      }, 1200);
    } catch {
      setSuccessMsg("Could not switch persona. Please retry.");
    } finally {
      setSwitching(false);
    }
  }

  function handleSignOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sif_token");
      localStorage.removeItem("sif_role");
      localStorage.removeItem("sif_username");
    }
    onClose();
    router.push("/login");
  }

  function handleSavePreferences() {
    setSuccessMsg("Profile notification preferences saved.");
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              {activeName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{activeName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Session
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeRole} • {activeEmail}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Persona Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Switch Test Account Persona
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">1-Click Fast Auth</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Instantly toggle between verified HSE roles to test role-based permissions and review workflows:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PERSONAS.map((p) => {
                const isCurrent = activeUsername === p.username;
                return (
                  <button
                    key={p.username}
                    type="button"
                    disabled={switching}
                    onClick={() => handleSwitchPersona(p)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? "bg-blue-50/80 border-blue-400 shadow-xs ring-2 ring-blue-500/10"
                        : "bg-white border-slate-200/90 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[20px]">
                        {p.icon}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.username}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Credentials Reference Box */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">key</span>
              Test Account Credentials Reference
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Role / Persona</th>
                    <th className="py-2 px-3">Username</th>
                    <th className="py-2 px-3">Password</th>
                    <th className="py-2 px-3">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Safety Manager</td>
                    <td className="py-2 px-3 font-mono text-blue-600">safety.manager</td>
                    <td className="py-2 px-3 font-mono text-slate-600">demo1234</td>
                    <td className="py-2 px-3 text-slate-600">Full Platform</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Site Safety Officer</td>
                    <td className="py-2 px-3 font-mono text-blue-600">site.officer</td>
                    <td className="py-2 px-3 font-mono text-slate-600">demo1234</td>
                    <td className="py-2 px-3 text-slate-600">Site Operations</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">System Admin</td>
                    <td className="py-2 px-3 font-mono text-blue-600">admin</td>
                    <td className="py-2 px-3 font-mono text-slate-600">demo1234</td>
                    <td className="py-2 px-3 text-slate-600">Superuser</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Account Details & Facility Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Facility Scope
              </span>
              <span className="text-xs font-bold text-slate-900 block">{activeFacility}</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                System Authorization
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Read, Write, Annotate, Action Closure
              </span>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Safety Intelligence Alert Preferences
            </h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-slate-700 font-medium">Critical SIF Precursor Push Notifications</span>
                <input
                  type="checkbox"
                  checked={criticalAlerts}
                  onChange={(e) => setCriticalAlerts(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-slate-700 font-medium">Multi-Sensor Well Telemetry Anomaly Alerts</span>
                <input
                  type="checkbox"
                  checked={telemetryAlerts}
                  onChange={(e) => setTelemetryAlerts(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-slate-700 font-medium">Daily Executive Safety Health Summary</span>
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Sign Out
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
