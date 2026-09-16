import React from 'react';

interface ShimmerSkeletonProps {
  className?: string;
  count?: number;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  className = 'h-16 w-full rounded-2xl',
  count = 1
}) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`shimmer-bg animate-shimmer border border-[#E8E2D8]/60 dark:border-[#183F32]/40 bg-[#FAF8F5] dark:bg-[#0E231B] ${className}`}
        />
      ))}
    </div>
  );
};
