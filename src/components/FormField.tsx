import React from 'react';

type FormFieldProps = {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  className?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
};

export const FormField = ({
  label,
  id,
  name,
  value,
  onChange,
  readOnly = false,
  className = '',
  type = 'text',
  placeholder,
  required,
  maxLength,
}: FormFieldProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium mb-1">
      {label}
    </label>
    <input
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      type={type}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className={`flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full ${readOnly ? 'bg-surface-sunken cursor-not-allowed text-gray-700' : ''} ${className} placeholder:text-gray-600`}
    />
  </div>
);
