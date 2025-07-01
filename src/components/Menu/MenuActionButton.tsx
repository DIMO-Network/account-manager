import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import classNames from 'classnames';

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
        'flex flex-row gap-3 items-center h-10 text-base rounded-full px-3 transition-colors font-medium w-full text-left cursor-pointer',
        {
          'text-gray-400 cursor-not-allowed': disabled,
          'bg-red-900 text-white font-bold': active,
          'hover:bg-gray-700': !disabled && !active,
          'text-white': active,
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
