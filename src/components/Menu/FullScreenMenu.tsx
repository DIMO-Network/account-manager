import type { FC } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { Menu } from './Menu';

type FullScreenMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  mainMenu: MenuItemConfig[];
  bottomMenu?: MenuItemConfig[];
};

const EMPTY_ARRAY: MenuItemConfig[] = [];

export const FullScreenMenu: FC<FullScreenMenuProps> = ({
  isOpen,
  onClose,
  mainMenu,
  bottomMenu = EMPTY_ARRAY,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 md:hidden">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Menu</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Menu
            mainMenu={mainMenu}
            bottomMenu={bottomMenu}
            onMenuItemClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};
