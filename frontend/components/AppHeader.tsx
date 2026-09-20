"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";

interface AppHeaderProps {
  onDiscover?: () => void;
  discovering?: boolean;
  onOpenCopilot?: () => void;
  onOpenWhatIf?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenProfile?: () => void;
}

export function AppHeader({
  onDiscover,
  discovering,
  onOpenCopilot,
  onOpenWhatIf,
  onToggleMobileMenu,
  onOpenProfile,
}: AppHeaderProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [username, setUsername] = useState("Safety Manager");
  const [role, setRole] = useState("Corporate HSE");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("sif_username");
      const storedRole = localStorage.getItem("sif_role");
      if (storedUser) {
        if (storedUser.toLowerCase().includes("pranjal")) setUsername("Pranjal Sharma");
        else setUsername(storedUser.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "));
      }
      if (storedRole) {
        setRole(storedRole.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" "));
      }
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/reports?keyword=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sif_token");
      localStorage.removeItem("sif_role");
      localStorage.removeItem("sif_username");
    }
    setShowUserMenu(false);
    router.push("/login");
  };

  const notifications = [
    {
      id: "1",
      title: "High pressure anomaly in Well-3",
      time: "5m ago",
      type: "critical",
      icon: "warning",
    },
    {
      id: "2",
      title: "Barrier bypass risk identified in Site Alpha",
      time: "28m ago",
      type: "high",
      icon: "shield_lock",
    },
    {
      id: "3",
      title: "New AI review candidate flagged (91% SIF)",
      time: "1h ago",
      type: "info",
      icon: "rate_review",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-white/95 backdrop-blur-md flex items-center px-4 md:px-8 justify-between border-b border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Left: Mobile menu toggle + Clean Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          )}

          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search precursor observations, broken barriers, facilities..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-full outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </form>
        </div>

        {/* Right controls: Clean bar with Discover, Bell, and Profile */}
        <div className="flex items-center gap-3">
          {/* Discover SIF Patterns Button */}
          {onDiscover && (
            <button
              type="button"
              onClick={onDiscover}
              disabled={discovering}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[17px] ${discovering ? "animate-spin" : ""}`}>
                {discovering ? "sync" : "auto_fix_high"}
              </span>
              <span className="hidden sm:inline">
                {discovering ? "Clustering Patterns..." : "Discover Patterns"}
              </span>
            </button>
          )}

          {/* Live Alerts Bell Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors relative cursor-pointer"
              title="Live Safety Alerts"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Live Safety Precursor Alerts</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    3 Active
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          n.type === "critical"
                            ? "bg-red-100 text-red-700"
                            : n.type === "high"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">{n.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-900 leading-tight truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 pt-2 border-t border-slate-100">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                  >
                    View All Command Center Alerts →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {username
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{username}</span>
                <span className="text-[10px] text-slate-400 block leading-none">{role}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{username}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{role}</p>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfileModal(true);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-blue-600">manage_accounts</span>
                    <span>Profile &amp; Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-amber-600">switch_account</span>
                    <span>Switch Test Persona</span>
                  </button>
                </div>

                <div className="p-1 pt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUserChange={(newName, newRole) => {
          setUsername(newName);
          setRole(newRole);
        }}
      />
    </>
  );
}
