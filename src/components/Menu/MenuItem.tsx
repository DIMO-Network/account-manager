import Link from 'next/link';
import type { FC, ReactNode } from 'react';
import { MenuActionButton } from './MenuActionButton';

type MenuItemProps = {
  link?: string | (() => void);
  disabled?: boolean;
  external?: boolean;
  iconClassName?: string;
  label: string;
  icon?: FC<{ className?: string }>;
  isHighlighted?: boolean;
  onClick?: () => void;
  component?: ReactNode;
  action?: () => void;
};

export const MenuItem: FC<MenuItemProps> = ({
  link,
  external = false,
  disabled = false,
  icon: Icon,
  iconClassName = 'h-5 w-5',
  label,
  isHighlighted = false,
  onClick,
  component,
  action,
}) => {
  const handleFunctionClick = () => {
    if (typeof link === 'function') {
      link();
    }
    onClick?.();
  };

  if (component) {
    return <li>{component}</li>;
  }

  if (link && typeof link === 'string') {
    return (
      <li>
        <Link
          href={disabled ? '#' : link}
          target={external ? '_blank' : '_self'}
          onClick={onClick}
          className="block"
        >
          <MenuActionButton disabled={disabled} active={isHighlighted}>
            {Icon && <Icon className={iconClassName} />}
            {label}
          </MenuActionButton>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <MenuActionButton
        onClick={action || handleFunctionClick}
        disabled={disabled}
        active={isHighlighted}
      >
        {Icon && <Icon className={iconClassName} />}
        {label}
      </MenuActionButton>
    </li>
  );
};
