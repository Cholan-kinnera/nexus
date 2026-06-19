import React from "react";
import type { LucideIcon } from "lucide-react";
import { PremiumButton } from "./PremiumButton";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isPrimaryLoading?: boolean;
  isPrimaryDisabled?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-16 bg-zinc-900/10 dark:bg-zinc-900/10 border border-dashed border-zinc-200/80 dark:border-zinc-850 rounded-2xl max-w-xl mx-auto font-sans">
      {/* Illustrated Icon Area */}
      <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400 mb-6 shadow-inner">
        <Icon size={22} strokeWidth={1.5} />
      </div>

      {/* Typography Hierarchy */}
      <h3 className="text-base font-bold text-zinc-100 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {primaryActionLabel && onPrimaryAction && (
          <PremiumButton
            variant="primary"
            size="sm"
            onClick={onPrimaryAction}
            isLoading={isPrimaryLoading}
            disabled={isPrimaryDisabled}
          >
            {primaryActionLabel}
          </PremiumButton>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <PremiumButton variant="ghost" size="sm" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </PremiumButton>
        )}
      </div>
    </div>
  );
};
