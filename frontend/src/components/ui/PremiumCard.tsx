import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ children, hoverable = true, padding = "md", className = "", ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    const paddings = {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const cardStyle =
      "bg-zinc-900/40 dark:bg-zinc-900/40 bg-white border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md overflow-hidden transform-gpu";

    if (!hoverable) {
      return (
        <div ref={ref} className={`${cardStyle} ${paddings[padding]} ${className}`} {...props}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        whileHover={
          shouldReduceMotion
            ? {
                borderColor: "var(--color-zinc-700, #3f3f46)",
              }
            : {
                y: -2,
                scale: 1.01,
                borderColor: "var(--color-zinc-700, #3f3f46)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08), 0 0 20px rgba(124, 58, 237, 0.02)",
              }
        }
        transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`${cardStyle} ${paddings[padding]} ${className} cursor-pointer`}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";
