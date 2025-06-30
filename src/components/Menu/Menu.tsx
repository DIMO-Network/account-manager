import type { FC } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { usePathname } from 'next/navigation';
import { AppConfig } from '@/utils/AppConfig';
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

    return currentPath === itemPath;
  };

  const mainMenuItems = menuItems.filter(item => !item.section || item.section === 'main');
  const bottomMenuItems = menuItems.filter(item => item.section === 'bottom');

  return (
    <div className="w-full px-4 py-6 flex flex-col gap-4 justify-between h-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center mb-6">
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
      </div>

      {/* Bottom section */}
      <ul className="flex flex-col gap-4 justify-center">
        {bottomMenuItems.length > 0 && (
          <div className="flex flex-col gap-3 mt-auto">
            {bottomMenuItems.map(item => (
              <MenuItem
                key={typeof item.link === 'string' ? item.link : item.label}
                {...item}
                isHighlighted={getIsHighlighted(item)}
                onClick={onMenuItemClick}
              />
            ))}
          </div>
        )}
      </ul>
    </div>
  );
};
