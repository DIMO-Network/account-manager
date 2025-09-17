'use client';

import { ChevronIcon } from '@/components/Icons';
import { COLORS } from '@/utils/designSystem';
import { useEffect, useMemo, useRef, useState } from 'react';

export type Option = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: Option[];
  value?: string;
  onChangeAction: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function Dropdown({
  options,
  value,
  onChangeAction,
  placeholder = 'Select an option',
  label,
  required = false,
  disabled = false,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search query using useMemo
  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, options]);

  // Close dropdown when clicking outside or tabbing out
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && isOpen) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Check if the next focused element is outside the dropdown
        timeoutRef.current = setTimeout(() => {
          const activeElement = document.activeElement;
          if (dropdownRef.current && !dropdownRef.current.contains(activeElement)) {
            setIsOpen(false);
            setSearchQuery('');
          }
        }, 0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    onChangeAction(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (!disabled) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      if (newIsOpen) {
        setSearchQuery('');
        // Focus search input when opening dropdown
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-md bg-surface-raised text-left ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${COLORS.text.primary}`}
        >
          <span className={selectedOption ? '' : 'text-gray-600'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronIcon
            orientation={isOpen ? 'up' : 'down'}
            className={`w-2 h-3 ${COLORS.text.secondary}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-surface-raised rounded-md shadow-lg max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 bg-surface-input border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0
                ? (
                    filteredOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option)}
                        className={`w-full px-4 py-2 text-left ${
                          option.value === value ? 'bg-gray-700' : ''
                        } ${COLORS.text.primary}`}
                      >
                        {option.label}
                      </button>
                    ))
                  )
                : (
                    <div className="px-4 py-2 text-gray-400">
                      No options found
                    </div>
                  )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
