'use client';

import type { Option } from './Dropdown';
import { useEffect, useState } from 'react';
import { getCountries } from '@/utils/locationData';
import { Dropdown } from './Dropdown';

type CountryDropdownProps = {
  value?: string;
  onChangeAction: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function CountryDropdown({
  value,
  onChangeAction,
  placeholder = 'Select a country',
  label = 'Country',
  required = false,
  disabled = false,
  className = '',
}: CountryDropdownProps) {
  const [countries, setCountries] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSetDefault, setHasSetDefault] = useState(false);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await getCountries();
        setCountries(countriesData);

        // Set US as default if no value is provided and we haven't set default yet
        if (!value && !hasSetDefault) {
          onChangeAction('US');
          setHasSetDefault(true);
        }
      } catch (error) {
        console.error('Failed to load countries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, [value, onChangeAction, hasSetDefault]);

  if (loading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="w-full px-4 py-2 rounded-md bg-surface-raised text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Dropdown
      options={countries}
      value={value}
      onChangeAction={onChangeAction}
      placeholder={placeholder}
      label={label}
      required={required}
      disabled={disabled}
      className={className}
    />
  );
}
