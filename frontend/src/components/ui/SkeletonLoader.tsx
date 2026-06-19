import React from "react";

// Reusable base skeleton components
export const SkeletonPulse: React.FC<{ className?: string }> = ({ className = "" }) => {
  return <div className={`shimmer-placeholder rounded ${className}`} />;
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse-slow">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 bg-zinc-900/40 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-3"
          >
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-8 w-16" />
            <SkeletonPulse className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Main Grid: Charts + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-zinc-900/40 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <SkeletonPulse className="h-5 w-32" />
            <SkeletonPulse className="h-8 w-24" />
          </div>
          <SkeletonPulse className="h-64 w-full rounded-lg" />
        </div>

        <div className="p-6 bg-zinc-900/40 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-4">
          <SkeletonPulse className="h-5 w-40" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-200/40 dark:border-zinc-800/40 last:border-0">
                <SkeletonPulse className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <SkeletonPulse className="h-3.5 w-3/4" />
                  <SkeletonPulse className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse-slow">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="p-6 bg-zinc-900/40 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <SkeletonPulse className="h-5 w-32" />
              <SkeletonPulse className="h-3 w-20" />
            </div>
            <SkeletonPulse className="h-6 w-12 rounded-full" />
          </div>
          <div className="space-y-2">
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-3 w-5/6" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <SkeletonPulse className="h-3.5 w-16" />
              <SkeletonPulse className="h-3.5 w-8" />
            </div>
            <SkeletonPulse className="h-2 w-full rounded-full" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((j) => (
                <SkeletonPulse key={j} className="h-6 w-6 rounded-full border border-zinc-900" />
              ))}
            </div>
            <SkeletonPulse className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TasksSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px] animate-pulse-slow">
      {[1, 2, 3].map((col) => (
        <div key={col} className="bg-zinc-950/20 dark:bg-zinc-900/20 rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-200/40 dark:border-zinc-800/40">
            <div className="flex items-center gap-2">
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-5 w-5 rounded-full" />
            </div>
            <SkeletonPulse className="h-4 w-4" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-4 bg-zinc-900/40 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-3"
              >
                <div className="flex justify-between items-start">
                  <SkeletonPulse className="h-4 w-3/4" />
                  <SkeletonPulse className="h-4 w-4 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonPulse className="h-2.5 w-full" />
                  <SkeletonPulse className="h-2.5 w-5/6" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-1.5">
                    <SkeletonPulse className="h-5 w-12 rounded" />
                    <SkeletonPulse className="h-5 w-10 rounded" />
                  </div>
                  <SkeletonPulse className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const NotificationsSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto p-1 animate-pulse-slow">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-900/10"
        >
          <SkeletonPulse className="h-8 w-8 rounded-full flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-center">
              <SkeletonPulse className="h-3.5 w-24" />
              <SkeletonPulse className="h-2.5 w-12" />
            </div>
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
