import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = "secondary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const baseStyle =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer font-sans whitespace-nowrap flex-shrink-0";

  const variants = {
    primary:
      "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold shadow-sm",
    secondary:
      "bg-zinc-900/50 hover:bg-zinc-900/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60 text-zinc-300 hover:text-zinc-100 border border-zinc-800/80 hover:border-zinc-700/80 shadow-sm",
    ghost:
      "bg-transparent hover:bg-zinc-800/10 dark:hover:bg-zinc-900/20 text-zinc-400 hover:text-zinc-200 border border-transparent",
    danger:
      "bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/60 hover:border-red-800/80 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-2xs gap-1.5 h-8",
    md: "px-4 py-2 text-xs gap-2 h-[38px]",
    lg: "px-5 py-2.5 text-sm gap-2 h-[44px]",
  };

  return (
    <motion.button
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...(props as Record<string, unknown>)}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </motion.button>
  );
};
