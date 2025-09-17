import type { FC } from 'react';
import type { MenuItemConfig } from '@/types/menu';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon, DIMOLogo } from '@/components/Icons';
import { COLORS, SPACING } from '@/utils/designSystem';
import { Menu } from './Menu';

type FullScreenMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItemConfig[];
};

type MenuState = {
  isAnimating: boolean;
  isClosing: boolean;
};

export const FullScreenMenu: FC<FullScreenMenuProps> = ({
  isOpen,
  onClose,
  menuItems,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [menuState, setMenuState] = useState<MenuState>({
    isAnimating: false,
    isClosing: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateMenuState = useCallback((updates: Partial<MenuState>) => {
    setMenuState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleClose = useCallback(() => {
    updateMenuState({ isClosing: true, isAnimating: false });
    // Wait for animation to complete before calling onClose
    timeoutRef.current = setTimeout(() => {
      updateMenuState({ isClosing: false });
      onClose();
    }, 300);
  }, [onClose, updateMenuState]);

  const handleLogoClick = useCallback(() => {
    router.push('/dashboard');
    handleClose();
  }, [router, handleClose]);

  const startAnimation = useCallback(() => {
    updateMenuState({ isAnimating: true });
  }, [updateMenuState]);

  const resetStates = useCallback(() => {
    updateMenuState({ isAnimating: false, isClosing: false });
  }, [updateMenuState]);

  const resetClosingState = useCallback(() => {
    updateMenuState({ isClosing: false });
  }, [updateMenuState]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen) {
      resetClosingState();
      document.addEventListener('mousedown', handleClickOutside);
      // Start animation after a brief delay to ensure DOM is ready
      timeoutRef.current = setTimeout(startAnimation, 10);
    } else {
      resetStates();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, handleClickOutside, startAnimation, resetStates, resetClosingState]);

  if (!isOpen && !menuState.isClosing) {
    return null;
  }

  return (
    <div
      className={`
        fixed inset-0 z-50 md:hidden bg-black bg-opacity-50 xs:w-[85%] w-full
        transform transition-transform duration-300 ease-in-out
        ${menuState.isAnimating ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div
        ref={menuRef}
        className="flex flex-col h-full w-full"
      >
        <div className={`flex justify-between items-center ${SPACING.md}`}>
          <button
            onClick={handleLogoClick}
            className="cursor-pointer"
            type="button"
          >
            <DIMOLogo className="h-6 w-auto" />
          </button>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg hover:bg-surface-sunken transition-colors ${COLORS.text.primary}`}
            aria-label="Close menu"
            type="button"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Menu
            menuItems={menuItems}
            onMenuItemClick={handleClose}
          />
        </div>
      </div>
    </div>
  );
};
