'use client';

import { COLORS } from '@/utils/designSystem';

type LoadingProps = {
  size?: number;
  color?: string;
  className?: string;
  speedMultiplier?: number;
};

export const Loading = ({
  size = 16,
  color = COLORS.loader.primary,
  className = '',
  speedMultiplier = 0.25,
}: LoadingProps) => {
  const dots = Array.from({ length: 3 }, (_, i) => i);

  const style = (i: number): React.CSSProperties => {
    return {
      backgroundColor: color,
      width: `${size}px`,
      height: `${size}px`,
      margin: '4px',
      borderRadius: '100%',
      display: 'inline-block',
      animation: `pulse ${0.75 / speedMultiplier}s ${(i * 0.12) / speedMultiplier}s infinite cubic-bezier(0.2, 0.68, 0.18, 1.08)`,
      animationFillMode: 'both',
    };
  };

  return (
    <div className={`inline-block ${className}`}>
      {dots.map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={index} style={style(index + 1)} className={color} />
      ))}

      <style jsx>
        {`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          45% {
            transform: scale(0.5);
            opacity: 0.7;
          }
          80% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}
      </style>
    </div>
  );
};
