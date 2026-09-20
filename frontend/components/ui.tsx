"use client";
import React from "react";
import Link from "next/link";
import { riskColor } from "@/lib/utils";

export function RiskBadge({
  level,
  className = "",
  size = "md",
}: {
  level?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const c = riskColor(level);
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-xs px-3 py-1 gap-2 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${c.badge} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {level || "UNKNOWN"}
    </span>
  );
}

export function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const s = status.toUpperCase().replace(/\s+/g, "_");
  let color = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  if (s === "HEALTHY" || s === "COMPLETED" || s === "CONFIRMED" || s === "ACTIVE") {
    color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotColor = "bg-emerald-500";
  } else if (s === "ATTENTION" || s === "IN_PROGRESS" || s === "HIGH" || s === "OPEN") {
    color = "bg-amber-50 text-amber-800 border-amber-200";
    dotColor = "bg-amber-500";
  } else if (s === "CRITICAL" || s === "REJECTED" || s === "DETERIORATING" || s === "OVERDUE") {
    color = "bg-red-50 text-red-700 border-red-200";
    dotColor = "bg-red-500";
  } else if (s === "IMPROVING" || s === "SIF") {
    color = "bg-blue-50 text-blue-700 border-blue-200";
    dotColor = "bg-blue-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
        hover ? "hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  badge,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="material-symbols-outlined text-primary text-[22px]">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {(action || badge) && <div className="shrink-0">{action || badge}</div>}
    </div>
  );
}

export function KpiCard({
  icon,
  label,
  title,
  value,
  trend,
  trendPositive,
  subtext,
  subtitle,
  badge,
  iconBg = "bg-blue-50 text-blue-600",
  className = "",
}: {
  icon: string;
  label?: string;
  title?: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  subtitle?: string;
  badge?: { label: string; color?: string };
  iconBg?: string;
  className?: string;
}) {
  const displayLabel = label || title || "";
  const displaySubtext = subtext || subtitle;

  let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (badge) {
    if (badge.color === "red") badgeColor = "bg-red-50 text-red-700 border-red-200";
    else if (badge.color === "amber") badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    else if (badge.color === "blue") badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
    else if (badge.color === "neutral") badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <Card className={`p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              trendPositive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {trend}
          </span>
        )}
        {badge && !trend && (
          <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="mt-4">
        <span className="text-xs font-semibold text-slate-500 tracking-tight block">
          {displayLabel}
        </span>
        <div className="text-2xl font-black text-slate-900 tracking-tight mt-1 tabular-nums">
          {value}
        </div>
        {displaySubtext && (
          <div className="text-[11px] text-slate-400 mt-1 font-medium">{displaySubtext}</div>
        )}
      </div>
    </Card>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-3 mb-4 ${className}`}>
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  title = "No data available",
  description = "There are no records matching the current criteria.",
  action,
  className = "",
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-12 border border-slate-200 text-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  message = "Failed to load data.",
  onRetry,
  className = "",
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`bg-red-50/80 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
        <span className="font-semibold">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function SkeletonLoader({
  className = "h-24 w-full",
}: {
  className?: string;
}) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`} />
  );
}

export function PatternLink({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={`/patterns/${id}`} className={`block hover:bg-slate-50 transition-colors ${className}`}>
      {children}
    </Link>
  );
}
