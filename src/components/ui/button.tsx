import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ink" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-xl",
      md: "px-4 py-2 text-xs sm:text-sm rounded-xl",
      lg: "px-6 py-3 text-sm rounded-2xl",
    };

    const variantStyles = {
      primary:
        "bg-brand-600 hover:bg-brand-700 text-white shadow-xs dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 dark:shadow-none",
      secondary:
        "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 dark:border-white/10 dark:shadow-none",
      ink:
        "bg-slate-900 hover:bg-slate-800 text-white shadow-xs dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 dark:shadow-none",
      outline:
        "border border-slate-200 hover:border-slate-300 text-slate-700 bg-transparent dark:border-white/10 dark:hover:border-white/20 dark:text-slate-300",
      ghost:
        "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 bg-transparent",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

