'use client';

import type { FunctionParameter } from '@/services/transaction-builder';
import { useMemo, useState } from 'react';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type ParameterInputsProps = {
  parameters: FunctionParameter[];
  values: (string | number | boolean)[];
  onParameterChangeAction: (index: number, value: string | number | boolean) => void;
};

export const ParameterInputs = ({
  parameters,
  values,
  onParameterChangeAction,
}: ParameterInputsProps) => {
  // Local state to store user input values (human-readable)
  const [inputValues, setInputValues] = useState<string[]>([]);

  // Compute display values from input values or convert wei back to tokens
  const displayValues = useMemo(() => {
    return parameters.map((param, index) => {
      const inputValue = inputValues[index];
      const weiValue = values[index] || '';

      // If user has typed something, use their input
      if (inputValue !== undefined) {
        return inputValue;
      }

      // Otherwise, convert wei back to human-readable for display
      if (param.type === 'uint256' && (param.name.toLowerCase().includes('amount') || param.name.toLowerCase().includes('value'))) {
        if (weiValue && !Number.isNaN(Number(weiValue)) && Number(weiValue) > 0) {
          // Convert wei back to tokens: divide by 10^18
          const tokenAmount = (Number(weiValue) / 1e18).toString();
          return tokenAmount;
        }
      }

      return weiValue.toString();
    });
  }, [parameters, values, inputValues]);

  if (parameters.length === 0) {
    return null;
  }

  const getInputType = (type: string): string => {
    if (type.includes('uint') || type.includes('int')) {
      return 'number';
    }
    if (type === 'bool') {
      return 'checkbox';
    }
    if (type === 'address') {
      return 'text';
    }
    return 'text';
  };

  const getPlaceholder = (type: string): string => {
    if (type.includes('uint') || type.includes('int')) {
      return '0';
    }
    if (type === 'address') {
      return '0x...';
    }
    if (type === 'bool') {
      return '';
    }
    if (type === 'string') {
      return 'Enter text...';
    }
    return 'Enter value...';
  };

  const getParameterDescription = (name: string, type: string): string => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('to') || lowerName.includes('recipient')) {
      return 'The address that will receive the tokens/assets';
    }
    if (lowerName.includes('amount') || lowerName.includes('value')) {
      return 'Amount in DIMO tokens';
    }
    if (lowerName.includes('from') || lowerName.includes('sender')) {
      return 'The address sending the tokens/assets';
    }
    if (lowerName.includes('token') && lowerName.includes('id')) {
      return 'The unique identifier of the NFT or token';
    }
    if (type.includes('address')) {
      return 'A valid Ethereum address (0x...)';
    }
    if (type.includes('uint') || type.includes('int')) {
      return 'A numeric value (whole number)';
    }
    if (type.includes('bool')) {
      return 'true or false';
    }
    if (type.includes('string')) {
      return 'Text or string value';
    }

    return 'Enter the required value for this parameter';
  };

  const handleInputChange = (index: number, value: any, type: string, paramName: string) => {
    let processedValue = value;

    // Convert based on type
    if (type === 'bool') {
      processedValue = Boolean(value);
    } else if (type.includes('uint') || type.includes('int')) {
      // Remove leading zeros for numeric inputs
      if (typeof value === 'string' && value.length > 1) {
        processedValue = value.replace(/^0+/, '') || '0';
      }
      processedValue = processedValue.toString();
    }

    // Update input values for display
    const newInputValues = [...inputValues];
    newInputValues[index] = processedValue;
    setInputValues(newInputValues);

    // For amount/value parameters, convert to wei for the parent
    if (type === 'uint256' && (paramName.toLowerCase().includes('amount') || paramName.toLowerCase().includes('value'))) {
      if (processedValue && !Number.isNaN(Number(processedValue)) && Number(processedValue) > 0) {
        // Convert to wei: multiply by 10^18
        const weiValue = BigInt(Math.floor(Number(processedValue) * 1e18)).toString();
        onParameterChangeAction(index, weiValue);
        return;
      }
    }

    onParameterChangeAction(index, processedValue);
  };

  return (
    <div>
      <div className={`block text-sm font-medium ${COLORS.text.secondary} mb-1`}>
        Function Parameters
      </div>
      <p className={`text-xs ${COLORS.text.muted} mb-3`}>
        Enter the values for each parameter required by the selected function
      </p>
      <div className="space-y-3">
        {parameters.map((param, index) => {
          const inputType = getInputType(param.type);
          const placeholder = getPlaceholder(param.type);
          const value = displayValues[index] || '';

          return (
            <div key={`${param.name}-${param.type}`} className="flex flex-col space-y-1">
              <label className={`text-sm font-medium ${COLORS.text.primary}`}>
                {param.name}
                {' '}
                (
                {param.type === 'uint256' && (param.name.toLowerCase().includes('amount') || param.name.toLowerCase().includes('value'))
                  ? 'tokens'
                  : param.type}
                )
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className={`text-xs ${COLORS.text.muted}`}>
                {getParameterDescription(param.name, param.type)}
              </p>

              {inputType === 'checkbox'
                ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={e => handleInputChange(index, e.target.checked, param.type, param.name)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`ml-2 text-sm ${COLORS.text.muted}`}>
                        {value ? 'true' : 'false'}
                      </span>
                    </div>
                  )
                : (
                    <input
                      type={inputType}
                      value={value}
                      onChange={e => handleInputChange(index, e.target.value, param.type, param.name)}
                      placeholder={placeholder}
                      className={`w-full px-4 py-2 ${BORDER_RADIUS.md} ${COLORS.background.tertiary} ${COLORS.text.primary} border ${COLORS.border.default} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  )}

              {param.type === 'address' && value && !value.startsWith('0x') && value.length > 0 && (
                <p className="text-xs text-red-600">Address should start with 0x</p>
              )}

              {param.type.includes('uint') && value && Number.isNaN(Number(value)) && (
                <p className="text-xs text-red-600">Must be a valid number</p>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};
