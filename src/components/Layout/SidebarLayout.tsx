'use client';

import type { ReactNode } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { type FC, useState } from 'react';
import { FullScreenMenu, Menu, MenuButton } from '@/components/Menu';
import { COLORS, SPACING } from '@/utils/designSystem';

type SidebarLayoutProps = {
  children: ReactNode;
  menuItems: MenuItemConfig[];
};

export const SidebarLayout: FC<SidebarLayoutProps> = ({
  children,
  menuItems,
}) => {
  const [isFullScreenMenuOpen, setIsFullScreenMenuOpen] = useState(false);

  return (
    <div className={`flex flex-col md:flex-row min-h-screen ${COLORS.background.primary}`}>
      {/* Sidebar */}
      <div className={`
        hidden md:flex md:w-64 md:flex-shrink-0 md:rounded-xl md:shadow-sm md:flex-col
        ml-6 my-6
        h-auto
        ${COLORS.background.secondary}
      `}
      >
        <div className="flex-1">
          <Menu
            menuItems={menuItems}
          />
        </div>
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
          menuItems={menuItems}
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
