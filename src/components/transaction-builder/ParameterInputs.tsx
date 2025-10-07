'use client';

import type { FunctionParameter } from '@/services/transaction-builder';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type ParameterInputsProps = {
  parameters: FunctionParameter[];
  values: any[];
  onParameterChangeAction: (index: number, value: any) => void;
};

export const ParameterInputs = ({
  parameters,
  values,
  onParameterChangeAction,
}: ParameterInputsProps) => {
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
      return 'The amount to transfer (in smallest unit, e.g., wei for ETH)';
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

  const add18Zeros = (amount: string): string => {
    if (!amount || Number.isNaN(Number(amount))) {
      return '0';
    }

    // Remove leading zeros and handle fractional numbers
    const numAmount = Number(amount);
    if (numAmount === 0) {
      return '0';
    }

    // Convert to string to avoid scientific notation for large numbers
    const amountStr = numAmount.toString();

    // Split by decimal point
    const [integerPart, decimalPart = ''] = amountStr.split('.');

    // Remove leading zeros from integer part
    const cleanInteger = integerPart?.replace(/^0+/, '') || '0';

    // Pad decimal part to 18 places or truncate if longer
    const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18);

    // Combine and remove trailing zeros
    const result = cleanInteger + paddedDecimal;
    return result.replace(/^0+/, '') || '0';
  };

  const remove18Zeros = (weiAmount: string): string => {
    if (!weiAmount || weiAmount.length < 18) {
      return '0';
    }

    // Remove leading zeros
    const cleanWei = weiAmount.replace(/^0+/, '') || '0';

    if (cleanWei.length <= 18) {
      // If the number is 18 digits or less, it's a decimal
      const padded = cleanWei.padStart(19, '0'); // Pad to 19 digits
      const integerPart = padded.slice(0, 1);
      const decimalPart = padded.slice(1);
      return `${integerPart}.${decimalPart}`.replace(/\.?0+$/, '');
    }

    // Split into integer and decimal parts
    const integerPart = cleanWei.slice(0, -18);
    const decimalPart = cleanWei.slice(-18);

    // Remove trailing zeros from decimal part
    const cleanDecimal = decimalPart.replace(/0+$/, '');

    if (cleanDecimal === '') {
      return integerPart;
    }

    return `${integerPart}.${cleanDecimal}`;
  };

  const handleInputChange = (index: number, value: any, type: string) => {
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
          const value = values[index] || '';

          return (
            <div key={`${param.name}-${param.type}`} className="flex flex-col space-y-1">
              <label className={`text-sm font-medium ${COLORS.text.primary}`}>
                {param.name}
                {' '}
                (
                {param.type}
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
                        onChange={e => handleInputChange(index, e.target.checked, param.type)}
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
                      onChange={e => handleInputChange(index, e.target.value, param.type)}
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

              {/* Amount Conversion Helper */}
              {(param.name.toLowerCase().includes('amount') || param.name.toLowerCase().includes('value')) && param.type.includes('uint') && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      const currentValue = value || '0';
                      const weiAmount = add18Zeros(currentValue);
                      handleInputChange(index, weiAmount, param.type);
                    }}
                  >
                    Add 18 Zeros (Convert to Wei)
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs rounded ${
                      (value || '0').length >= 18
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                    onClick={() => {
                      const currentValue = value || '0';
                      if (currentValue.length >= 18) {
                        const tokenAmount = remove18Zeros(currentValue);
                        handleInputChange(index, tokenAmount, param.type);
                      } else {
                        // Clear the input if not enough digits
                        handleInputChange(index, '0', param.type);
                      }
                    }}
                  >
                    {(value || '0').length >= 18
                      ? 'Remove 18 Zeros (Show as Tokens)'
                      : 'Clear Input'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
