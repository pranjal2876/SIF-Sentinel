export function riskColor(level?: string | null) {
  const norm = (level || "").toUpperCase();
  switch (norm) {
    case "CRITICAL":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-500",
        ring: "ring-red-500",
        solidBg: "bg-red-600",
        badge: "bg-red-50 text-red-700 border-red-200",
      };
    case "HIGH":
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        dot: "bg-orange-500",
        ring: "ring-orange-500",
        solidBg: "bg-orange-500",
        badge: "bg-orange-50 text-orange-700 border-orange-200",
      };
    case "MODERATE":
    case "MEDIUM":
    case "ATTENTION":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        dot: "bg-amber-500",
        ring: "ring-amber-500",
        solidBg: "bg-amber-500",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "LOW":
    case "HEALTHY":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        ring: "ring-emerald-500",
        solidBg: "bg-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
        ring: "ring-slate-400",
        solidBg: "bg-slate-600",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export function trendLabel(trend?: string | null) {
  const norm = (trend || "").toLowerCase();
  switch (norm) {
    case "increasing":
      return { icon: "↑", color: "text-red-600", bg: "bg-red-50", word: "Increasing" };
    case "decreasing":
      return { icon: "↓", color: "text-emerald-600", bg: "bg-emerald-50", word: "Decreasing" };
    case "new":
      return { icon: "●", color: "text-blue-600", bg: "bg-blue-50", word: "Newly Emerging" };
    default:
      return { icon: "→", color: "text-slate-500", bg: "bg-slate-50", word: "Stable" };
  }
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
