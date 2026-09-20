"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  onDiscover?: () => void;
  discovering?: boolean;
  onOpenCopilot?: () => void;
  onOpenWhatIf?: () => void;
  onToggleMobileMenu?: () => void;
}

export function AppHeader({
  onDiscover,
  discovering,
  onOpenCopilot,
  onOpenWhatIf,
  onToggleMobileMenu,
}: AppHeaderProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState("All Facilities");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [username, setUsername] = useState("Pranjal Sharma");
  const [role, setRole] = useState("Administrator");

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
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white/95 backdrop-blur-md z-40 flex items-center px-4 md:px-7 justify-between border-b border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile menu toggle + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        )}

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents, facilities, keywords..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
        </form>

        {/* Facility Selector */}
        <div className="hidden lg:flex items-center">
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <option value="All Facilities">All Facilities</option>
            <option value="North Rig">North Rig</option>
            <option value="Processing Unit">Processing Unit</option>
            <option value="Storage Tank">Storage Tank</option>
            <option value="Offshore-3">Offshore-3</option>
            <option value="Utility Block">Utility Block</option>
            <option value="Site Alpha">Site Alpha</option>
            <option value="Site Bravo">Site Bravo</option>
          </select>
        </div>

        {/* Date Range Badge */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap">
          <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_today</span>
          <span>Sep 1, 2025 — Sep 20, 2026</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* System Operational Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Operational</span>
        </div>

        {/* AI Action Trigger: Discover SIF Patterns */}
        {onDiscover && (
          <button
            onClick={onDiscover}
            disabled={discovering}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[12px] font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px] ${discovering ? "animate-spin" : ""}`}>
              {discovering ? "sync" : "auto_fix_high"}
            </span>
            <span>{discovering ? "Clustering..." : "Discover Patterns"}</span>
          </button>
        )}

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Live Safety Alerts</span>
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
                  View All Live Alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              {username.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight">{username}</span>
              <span className="text-[10px] text-slate-400 block leading-none">{role}</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{username}</p>
                <p className="text-[10px] text-slate-500">{role}</p>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                Profile Settings
              </Link>
              <Link
                href="/login"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
