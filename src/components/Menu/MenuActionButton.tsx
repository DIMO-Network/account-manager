import { COLORS } from '@/utils/designSystem';
import classNames from 'classnames';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export type MenuActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

export function MenuActionButton({
  children,
  active = false,
  disabled = false,
  className = '',
  ...props
}: PropsWithChildren<MenuActionButtonProps>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={classNames(
        'flex flex-row gap-3 items-center h-10 text-base rounded-full px-3 transition-colors font-medium w-full text-left',
        {
          'cursor-pointer': !disabled,
          'cursor-not-allowed': disabled,
          [COLORS.button.menu.disabled]: disabled,
          [COLORS.button.menu.active]: active,
          [COLORS.button.menu.default]: !disabled && !active,
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
