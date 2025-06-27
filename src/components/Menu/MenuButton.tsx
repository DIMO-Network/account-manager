import type { FC } from 'react';

type MenuButtonProps = {
  onClick: () => void;
  className?: string;
};

export const MenuButton: FC<MenuButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      className={`bg-white rounded-lg p-3 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
      aria-label="Toggle menu"
      type="button"
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
};
