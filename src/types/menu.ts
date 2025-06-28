import type { FC } from 'react';

export type MenuItemConfig = {
  label: string;
  icon?: FC<{ className?: string }>;
  iconClassName?: string;
  link: string | (() => void);
  external?: boolean;
  disabled?: boolean;
};
