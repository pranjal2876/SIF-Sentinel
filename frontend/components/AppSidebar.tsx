"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppSidebarProps {
  onOpenCopilot?: () => void;
  onOpenWhatIf?: () => void;
}

export function AppSidebar({ onOpenCopilot, onOpenWhatIf }: AppSidebarProps) {
  const pathname = usePathname();

  const links = [
    { name: "Command Center", href: "/dashboard", icon: "dashboard" },
    { name: "Emerging Patterns", href: "/patterns", icon: "radar" },
    { name: "Barrier Health", href: "/barrier-health", icon: "health_and_safety" },
    { name: "Preventive Actions", href: "/actions", icon: "assignment_turned_in" },
    { name: "Report Telemetry", href: "/reports", icon: "description" },
    { name: "Report Analyzer", href: "/reports/analyze", icon: "psychology" },
    { name: "Dataset Ingestion", href: "/reports/upload", icon: "upload_file" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white z-50 flex flex-col border-r border-slate-200 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md text-white">
          <span className="material-symbols-outlined text-2xl">shield</span>
        </div>
        <div>
          <span className="text-[17px] font-bold text-slate-900 tracking-tight block">SIF Sentinel</span>
          <span className="text-[11px] text-slate-500 font-medium block">Precursor Intelligence</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Safety Operations
        </div>
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== "/dashboard");
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className={`material-symbols-outlined mr-3 text-[20px] ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"}`}>
                {link.icon}
              </span>
              <span className="text-[13px]">{link.name}</span>
            </Link>
          );
        })}

        {/* Oil & Gas ML Modules */}
        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Oil & Gas ML Modules
        </div>
        <Link
          href="/oil-well-intelligence"
          className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group ${
            pathname === "/oil-well-intelligence"
              ? "bg-purple-900 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span className={`material-symbols-outlined mr-3 text-[20px] ${pathname === "/oil-well-intelligence" ? "text-white" : "text-purple-600 group-hover:text-purple-700"}`}>
            oil_barrel
          </span>
          <span className="text-[13px]">Oil-Well Intelligence</span>
        </Link>
        <Link
          href="/offshore-analytics"
          className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group ${
            pathname === "/offshore-analytics"
              ? "bg-blue-900 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span className={`material-symbols-outlined mr-3 text-[20px] ${pathname === "/offshore-analytics" ? "text-white" : "text-blue-600 group-hover:text-blue-700"}`}>
            water
          </span>
          <span className="text-[13px]">Offshore & OISD Data</span>
        </Link>

        {/* Intelligence Tools Quick Triggers */}
        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Intelligence Tools
        </div>

        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition-all cursor-pointer text-left group"
          >
            <span className="material-symbols-outlined mr-3 text-[20px] text-purple-600 group-hover:scale-110 transition-transform">
              smart_toy
            </span>
            <span className="text-[13px] font-semibold">Safety Copilot</span>
          </button>
        )}

        {onOpenWhatIf && (
          <button
            onClick={onOpenWhatIf}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-all cursor-pointer text-left group"
          >
            <span className="material-symbols-outlined mr-3 text-[20px] text-primary group-hover:scale-110 transition-transform">
              tune
            </span>
            <span className="text-[13px] font-semibold">What-If Simulator</span>
          </button>
        )}
      </nav>

      {/* Provenance Badge & User Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 mb-3">
          <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-bold">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Data Provenance</span>
          </div>
          <p className="text-[10px] text-amber-800/90 leading-tight mt-0.5">
            SIH26165 Prototype. Uses synthetic &amp; public datasets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
            SO
          </div>
          <div className="overflow-hidden">
            <p className="text-[12px] font-semibold text-slate-900 truncate">Safety Officer</p>
            <p className="text-[10px] text-slate-500">Expert Reviewer Role</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
