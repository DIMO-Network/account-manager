'use client';

import type { ReactNode } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { type FC, useState } from 'react';
import { FullScreenMenu, Menu, MenuButton } from '@/components/Menu';
import { COLORS, SPACING } from '@/utils/designSystem';

type SidebarLayoutProps = {
  children: ReactNode;
  mainMenu: MenuItemConfig[];
  bottomNav?: ReactNode;
};

export const SidebarLayout: FC<SidebarLayoutProps> = ({
  children,
  mainMenu,
  bottomNav,
}) => {
  const [isFullScreenMenuOpen, setIsFullScreenMenuOpen] = useState(false);

  return (
    <div className={`flex flex-col md:flex-row min-h-screen ${COLORS.background.primary}`}>
      {/* Sidebar */}
      <div className={`
        hidden md:flex md:mr-6 md:w-64 md:flex-shrink-0 md:rounded-xl md:shadow-sm md:flex-col
        ${COLORS.background.secondary}
        border-r ${COLORS.border.default}
      `}
      >
        <div className="flex-1">
          <Menu
            mainMenu={mainMenu}
          />
        </div>

        {/* Bottom section with sign in/out and locale switcher */}
        {bottomNav && (
          <div className={`p-4 border-t ${COLORS.border.default}`}>
            {bottomNav}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Mobile Header */}
        <div className={`
          md:hidden
          ${COLORS.background.primary}
          border-b ${COLORS.border.default}
          ${SPACING.sm}
          flex items-center justify-between
        `}
        >
          <MenuButton
            onClick={() => setIsFullScreenMenuOpen(true)}
            className="mr-4"
          />
        </div>

        {/* Full Screen Menu for Mobile */}
        <FullScreenMenu
          isOpen={isFullScreenMenuOpen}
          onClose={() => setIsFullScreenMenuOpen(false)}
          mainMenu={mainMenu}
          bottomNav={bottomNav}
        />

        {/* Page Content */}
        <main className={`
          flex-1
          ${SPACING.md}
          overflow-y-auto overflow-x-auto
        `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
