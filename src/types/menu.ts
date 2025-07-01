import type { FC, ReactNode } from 'react';

export type MenuItemConfig = {
  label: string;
  icon?: FC<{ className?: string }>;
  iconClassName?: string;
  link?: string | (() => void);
  external?: boolean;
  disabled?: boolean;
  component?: ReactNode; // For custom components like SignOutButton or LocaleSwitcher
  action?: () => void; // For action items that don't have links
  section?: 'main' | 'bottom'; // To group items (main menu vs bottom nav)
};
