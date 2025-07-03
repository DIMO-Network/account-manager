import type { FC } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { usePathname } from 'next/navigation';
import { AppConfig } from '@/utils/AppConfig';
import { COLORS } from '@/utils/designSystem';
import { MenuItem } from './MenuItem';

type MenuProps = {
  menuItems: MenuItemConfig[];
  onMenuItemClick?: () => void;
};

export const Menu: FC<MenuProps> = ({ menuItems, onMenuItemClick }) => {
  const pathname = usePathname();

  const getIsHighlighted = (item: MenuItemConfig) => {
    if (typeof item.link !== 'string') {
      return false;
    }

    const currentPath = pathname.replace(/\/$/, '');
    const itemPath = item.link.replace(/\/$/, '');

    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
  };

  const mainMenuItems = menuItems.filter(item => !item.section || item.section === 'main');
  const bottomMenuItems = menuItems.filter(item => item.section === 'bottom');

  return (
    <div className={`flex flex-col gap-4 md:rounded-xl px-4 py-6 h-full w-full md:w-64 ${COLORS.background.primary}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {AppConfig.name}
        </h1>
      </div>
      <ul className="flex flex-col gap-4 justify-center">
        {mainMenuItems.map(item => (
          <MenuItem
            key={typeof item.link === 'string' ? item.link : item.label}
            {...item}
            isHighlighted={getIsHighlighted(item)}
            onClick={onMenuItemClick}
          />
        ))}
      </ul>

      {/* Bottom section */}
      {bottomMenuItems.length > 0 && (
        <ul className="flex flex-col gap-3 mt-auto justify-center">
          {bottomMenuItems.map(item => (
            <MenuItem
              key={typeof item.link === 'string' ? item.link : item.label}
              {...item}
              isHighlighted={getIsHighlighted(item)}
              onClick={onMenuItemClick}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
