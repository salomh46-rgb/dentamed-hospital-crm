import React from 'react';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className = '',
  size = 200,
  duration = 10,
  borderWidth = 1.5,
  colorFrom = '#C5A880',
  colorTo = '#112E24',
  delay = 0
}) => {
  return (
    <div
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--border-width': `${borderWidth}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`
        } as React.CSSProperties
      }
      className={`pointer-events-none absolute inset-0 rounded-[inherit] border-[calc(var(--border-width))] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square w-[calc(var(--size))] animate-border-beam [animation-delay:var(--delay)] [background:radial-gradient(ellipse_at_center,var(--color-from),var(--color-to),transparent_70%)] [offset-anchor:calc(var(--size)/2)_50%] [offset-path:rect(0_auto_auto_0_round_calc(var(--size)))]"
      />
    </div>
  );
};
