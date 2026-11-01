import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "blue"
    | "brand"
    | "success"
    | "warning"
    | "info"
    | "purple";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10",
    primary:
      "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border-brand-200/80 dark:border-brand-800/60",
    blue:
      "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border-brand-200/80 dark:border-brand-800/60",
    brand:
      "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border-brand-200/80 dark:border-brand-800/60",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    info:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/60",
    purple:
      "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0 inline-block animate-pulse" />
      )}
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const variantMap: Record<
    string,
    "default" | "primary" | "success" | "warning" | "info" | "purple"
  > = {
    Idea: "default",
    Prototype: "info",
    MVP: "primary",
    Beta: "purple",
    Scaling: "success",
    Growth: "success",
  };

  return (
    <Badge
      variant={variantMap[stage] || "default"}
      size="sm"
      dot={stage === "Scaling" || stage === "Growth"}
    >
      {stage}
    </Badge>
  );
}
