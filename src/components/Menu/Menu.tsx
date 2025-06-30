import type { FC } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { usePathname } from 'next/navigation';
import { AppConfig } from '@/utils/AppConfig';
import { MenuItem } from './MenuItem';

type MenuProps = {
  mainMenu: MenuItemConfig[];
  bottomMenu?: MenuItemConfig[];
  onMenuItemClick?: () => void;
};

const EMPTY_ARRAY: MenuItemConfig[] = [];

export const Menu: FC<MenuProps> = ({ mainMenu, bottomMenu = EMPTY_ARRAY, onMenuItemClick }) => {
  const pathname = usePathname();

  const getIsHighlighted = (item: MenuItemConfig) => {
    if (typeof item.link !== 'string') {
      return false;
    }

    const currentPath = pathname.replace(/\/$/, '');
    const itemPath = item.link.replace(/\/$/, '');

    return currentPath === itemPath;
  };

  return (
    <div className="w-full px-4 py-6 flex flex-col gap-4 justify-between">
      <ul className="flex flex-col gap-4 justify-center">
        <div className="flex flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            {AppConfig.name}
          </h1>
        </div>

        {mainMenu.map(item => (
          <MenuItem
            key={typeof item.link === 'string' ? item.link : item.label}
            {...item}
            isHighlighted={getIsHighlighted(item)}
            onClick={onMenuItemClick}
          />
        ))}
      </ul>

      {bottomMenu.length > 0 && (
        <ul className="flex flex-col gap-4 justify-center">
          {bottomMenu.map(item => (
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
