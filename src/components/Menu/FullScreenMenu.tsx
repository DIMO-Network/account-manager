import type { FC } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { CloseIcon, DIMOLogo } from '@/components/Icons';
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
    <div className="fixed inset-0 z-50 md:hidden bg-black">
      <div className="flex flex-col h-full">
        <div className={`flex justify-between items-center ${SPACING.md}`}>
          <DIMOLogo className="h-6 w-auto" />
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-surface-sunken transition-colors ${COLORS.text.primary}`}
            aria-label="Close menu"
            type="button"
          >
            <CloseIcon className="w-6 h-6" />
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
