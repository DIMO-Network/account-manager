'use client';

import { FullScreenMenu, Menu, MenuButton } from '@/components/Menu';
import { COLORS, SPACING } from '@/utils/designSystem';
import { useState } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import type { FC, ReactNode } from 'react';
import { Header } from './Header';

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
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <div
        className={`
          hidden md:flex 
          h-screen sticky top-0
          p-6
        `}
      >
        <Menu menuItems={menuItems} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Mobile Header */}
        <div className={`
          md:hidden
          ${SPACING.sm} ${COLORS.background.primary}
          flex items-center sticky top-0 z-10
        `}
        >
          <MenuButton
            onClick={() => setIsFullScreenMenuOpen(true)}
            className="w-10 h-10 mr-4 flex-shrink-0"
          />
          <div className="flex-1">
            <Header />
          </div>
        </div>

        {/* Full Screen Menu for Mobile */}
        <FullScreenMenu
          isOpen={isFullScreenMenuOpen}
          onClose={() => setIsFullScreenMenuOpen(false)}
          menuItems={menuItems}
        />

        {/* Desktop Header */}
        <div
          className="hidden md:block sticky top-0 z-10 py-6 pr-4"
        >
          <Header />
        </div>

        {/* Page Content */}
        <main className={`
          flex-1
          overflow-y-auto overflow-x-auto p-4 md:p-0 md:pr-4
        `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
