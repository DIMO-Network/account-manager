import type { PropsWithChildren } from 'react';
import type { FC } from 'react';
import classNames from 'classnames';
import Link from 'next/link';

type MenuItemProps = {
  link: string | (() => void);
  disabled?: boolean;
  external?: boolean;
  iconClassName?: string;
  label: string;
  icon?: FC<{ className?: string }>;
  isHighlighted?: boolean;
  onClick?: () => void;
};

const MenuItemWrapper: FC<PropsWithChildren<{
  link: string | (() => void);
  disabled: boolean;
  external: boolean;
  onClick?: () => void;
  handleFunctionClick: () => void;
}>> = ({ link, disabled, external, onClick, handleFunctionClick, children }) => {
  if (typeof link === 'function') {
    return <button onClick={handleFunctionClick} className="w-full text-left" type="button">{children}</button>;
  }
  return (
    <Link
      href={disabled ? '#' : link}
      target={external ? '_blank' : '_self'}
      onClick={onClick}
      className="w-full block"
    >
      {children}
    </Link>
  );
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
}) => {
  const handleFunctionClick = () => {
    if (typeof link === 'function') {
      link();
    }
    onClick?.();
  };

  return (
    <li
      className={classNames(
        'flex flex-row gap-3 items-center text-gray-700 h-10 text-base rounded-lg px-3 transition-colors',
        {
          'text-gray-400 cursor-not-allowed': disabled,
          'bg-blue-100 text-blue-700': isHighlighted,
          'hover:bg-gray-100': !disabled && !isHighlighted,
        },
      )}
    >
      {Icon && <Icon className={iconClassName} />}
      <MenuItemWrapper
        link={link}
        disabled={disabled}
        external={external}
        onClick={onClick}
        handleFunctionClick={handleFunctionClick}
      >
        {label}
      </MenuItemWrapper>
    </li>
  );
};
