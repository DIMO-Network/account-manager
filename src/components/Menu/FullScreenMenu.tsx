import type { FC } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { DIMOLogo } from '@/components/Icons';
import { COLORS, SPACING } from '@/utils/designSystem';
import { Menu } from './Menu';

type FullScreenMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItemConfig[];
};

export const FullScreenMenu: FC<FullScreenMenuProps> = ({
  isOpen,
  onClose,
  menuItems,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${COLORS.background.primary}`}>
      <div className="flex flex-col h-full">
        <div className={`flex justify-between items-center ${SPACING.md} border-b ${COLORS.border.default}`}>
          <DIMOLogo className="h-6 w-auto" />
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
            menuItems={menuItems}
            onMenuItemClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};
