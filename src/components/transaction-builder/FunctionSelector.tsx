'use client';

import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type FunctionSelectorProps = {
  functions: Array<{
    name: string;
    type: string;
    inputs: Array<{
      name: string;
      type: string;
    }>;
    stateMutability?: string;
  }>;
  selectedFunction: string;
  onFunctionSelectAction: (functionName: string) => void;
};

export const FunctionSelector = ({
  functions,
  selectedFunction,
  onFunctionSelectAction,
}: FunctionSelectorProps) => {
  if (functions.length === 0) {
    return null;
  }

  return (
    <div>
      <label htmlFor="function-select" className={`block text-sm font-medium ${COLORS.text.secondary} mb-1`}>
        Contract Function
      </label>
      <p className={`text-xs ${COLORS.text.muted} mb-2`}>
        The function is automatically selected based on your chosen recovery action
      </p>
      <select
        id="function-select"
        value={selectedFunction}
        onChange={e => onFunctionSelectAction(e.target.value)}
        className={`w-full px-4 py-2 ${BORDER_RADIUS.md} ${COLORS.background.tertiary} ${COLORS.text.primary} border ${COLORS.border.default} focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <option value="">Select a function...</option>
        {functions.map(func => (
          <option key={func.name} value={func.name}>
            {func.name}
            (
            {func.inputs.map(input => `${input.type} ${input.name}`).join(', ')}
            )
          </option>
        ))}
      </select>

      {selectedFunction && (
        <div className={`mt-2 p-3 ${COLORS.background.tertiary} ${BORDER_RADIUS.md}`}>
          <div className={`text-sm ${COLORS.text.muted}`}>
            <strong>Function:</strong>
            {' '}
            {selectedFunction}
          </div>
          <div className={`text-sm ${COLORS.text.muted} mt-1`}>
            <strong>Parameters:</strong>
            {' '}
            {functions.find(f => f.name === selectedFunction)?.inputs.length || 0}
          </div>
          {functions.find(f => f.name === selectedFunction)?.stateMutability && (
            <div className={`text-sm ${COLORS.text.muted} mt-1`}>
              <strong>Type:</strong>
              {' '}
              {functions.find(f => f.name === selectedFunction)?.stateMutability}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
