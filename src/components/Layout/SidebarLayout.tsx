'use client';

import type { ReactNode } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { type FC, useState } from 'react';
import { FullScreenMenu, Menu, MenuButton } from '@/components/Menu';

type SidebarLayoutProps = {
  children: ReactNode;
  mainMenu: MenuItemConfig[];
  bottomMenu?: MenuItemConfig[];
  rightNav?: ReactNode;
};

const EMPTY_ARRAY: MenuItemConfig[] = [];

export const SidebarLayout: FC<SidebarLayoutProps> = ({
  children,
  mainMenu,
  bottomMenu = EMPTY_ARRAY,
  rightNav,
}) => {
  const [isFullScreenMenuOpen, setIsFullScreenMenuOpen] = useState(false);

  return (
    <div className="flex flex-row py-6 pl-6 bg-gray-50 min-h-screen items-stretch">
      {/* Sidebar */}
      <div className="hidden md:flex md:mr-6 md:w-64 md:flex-shrink-0 md:rounded-xl md:bg-white md:shadow-sm md:flex-col">
        <div className="flex-1">
          <Menu
            mainMenu={mainMenu}
            bottomMenu={bottomMenu}
          />
        </div>

        {/* Bottom section with sign in/out and locale switcher */}
        {rightNav && (
          <div className="p-4 border-t border-gray-200">
            {rightNav}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-row items-center justify-between pr-6 mb-6">
          <div className="md:hidden">
            <MenuButton
              onClick={() => setIsFullScreenMenuOpen(true)}
              className="mr-4"
            />
          </div>

          {/* Show locale switcher in header on mobile */}
          <div className="flex items-center gap-4 md:hidden">
            {rightNav}
          </div>
        </div>

        {/* Full Screen Menu for Mobile */}
        <FullScreenMenu
          isOpen={isFullScreenMenuOpen}
          onClose={() => setIsFullScreenMenuOpen(false)}
          mainMenu={mainMenu}
          bottomMenu={bottomMenu}
        />

        {/* Page Content */}
        <main className="overflow-y-auto overflow-x-auto py-6 pr-6 w-full flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
