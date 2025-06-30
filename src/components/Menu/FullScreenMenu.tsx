import type { FC, ReactNode } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { COLORS, SPACING } from '@/utils/designSystem';
import { Menu } from './Menu';

type FullScreenMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  mainMenu: MenuItemConfig[];
  bottomNav?: ReactNode;
};

export const FullScreenMenu: FC<FullScreenMenuProps> = ({
  isOpen,
  onClose,
  mainMenu,
  bottomNav,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${COLORS.background.primary}`}>
      <div className="flex flex-col h-full">
        <div className={`flex justify-between items-center ${SPACING.md} border-b ${COLORS.border.default}`}>
          <h1 className={`text-xl font-bold ${COLORS.text.primary}`}>Menu</h1>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-surface-sunken transition-colors ${COLORS.text.primary}`}
            aria-label="Close menu"
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Menu
            mainMenu={mainMenu}
            onMenuItemClick={onClose}
          />
        </div>

        {/* Bottom section with sign in/out and locale switcher */}
        {bottomNav && (
          <div className={`${SPACING.md} border-t ${COLORS.border.default}`}>
            {bottomNav}
          </div>
        )}
      </div>
    </div>
  );
};
