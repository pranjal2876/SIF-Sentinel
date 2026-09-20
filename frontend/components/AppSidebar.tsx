"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppSidebarProps {
  onOpenCopilot?: () => void;
  onOpenWhatIf?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppSidebar({
  onOpenCopilot,
  onOpenWhatIf,
  isMobileOpen = false,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [username, setUsername] = useState("Pranjal Sharma");
  const [role, setRole] = useState("Administrator");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("sif_username");
      const storedRole = localStorage.getItem("sif_role");
      if (storedUser) {
        // Format username nicely (e.g., safety.manager -> Safety Manager or Pranjal Sharma)
        if (storedUser.toLowerCase().includes("pranjal")) setUsername("Pranjal Sharma");
        else setUsername(storedUser.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "));
      }
      if (storedRole) {
        setRole(storedRole.split("_").map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" "));
      }
    }
  }, []);

  const navGroups = [
    {
      title: "OPERATIONS",
      items: [
        { name: "Command Center", href: "/dashboard", icon: "dashboard" },
        { name: "AI Review Queue", href: "/review-queue", icon: "rate_review" },
        { name: "Preventive Actions", href: "/actions", icon: "assignment_turned_in" },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        { name: "Emerging Patterns", href: "/patterns", icon: "radar" },
        { name: "Barrier Health", href: "/barrier-health", icon: "health_and_safety" },
        { name: "Report Telemetry", href: "/reports", icon: "description" },
        { name: "Report Analyzer", href: "/reports/analyze", icon: "psychology" },
      ],
    },
    {
      title: "DATA",
      items: [
        { name: "Dataset Ingestion", href: "/reports/upload", icon: "upload_file" },
        { name: "Oil-Well Intelligence", href: "/oil-well-intelligence", icon: "oil_barrel" },
        { name: "Offshore & OISD Data", href: "/offshore-analytics", icon: "water" },
      ],
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md text-white group-hover:bg-blue-500 transition-colors">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-bold text-white tracking-tight">SIF Sentinel</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">Prevent Today. Protect Tomorrow.</span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (pathname?.startsWith(item.href) && item.href !== "/dashboard");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center px-3 py-2 rounded-xl text-[13px] font-medium transition-all group ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined mr-3 text-[19px] transition-colors ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* TOOLS Section */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
            TOOLS
          </div>
          <div className="space-y-0.5">
            {onOpenCopilot && (
              <button
                type="button"
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenCopilot();
                }}
                className="w-full flex items-center px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all text-left cursor-pointer group"
              >
                <span className="material-symbols-outlined mr-3 text-[19px] text-blue-400 group-hover:scale-110 transition-transform">
                  smart_toy
                </span>
                <span className="truncate">Safety Copilot</span>
                <span className="ml-auto text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.2 rounded font-bold">
                  AI
                </span>
              </button>
            )}

            {onOpenWhatIf && (
              <button
                type="button"
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenWhatIf();
                }}
                className="w-full flex items-center px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all text-left cursor-pointer group"
              >
                <span className="material-symbols-outlined mr-3 text-[19px] text-purple-400 group-hover:scale-110 transition-transform">
                  tune
                </span>
                <span className="truncate">What-If Simulator</span>
              </button>
            )}
          </div>
        </div>

        {/* SYSTEM Section */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
            SYSTEM
          </div>
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              onClick={onCloseMobile}
              className="flex items-center px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all group"
            >
              <span className="material-symbols-outlined mr-3 text-[19px] text-slate-400 group-hover:text-slate-200">
                settings
              </span>
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* User Info & Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
            {getInitials(username)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-white truncate leading-tight">{username}</p>
            <p className="text-[10px] text-slate-400 truncate">{role}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Connected to Intelligence API" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 z-50 flex-col border-r border-slate-800/60 shadow-[2px_0_12px_rgba(0,0,0,0.06)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
