import type {
  FunctionParameter,
  RecoveryTemplate,
  TransactionBuilderConfig,
  TransactionPreview,
} from '@/services/transaction-builder';
import { useCallback, useEffect, useReducer } from 'react';
import { createTransactionBuilder, getRecoveryTemplates } from '@/services/transaction-builder';

type State = {
  templates: RecoveryTemplate[];
  functionParameters: FunctionParameter[];
  transactionPreview: TransactionPreview | null;
  loading: boolean;
  error: string | null;
  successMessage: {
    transactionHash: string;
    explorerUrl: string;
  } | null;
};

type Action
  = | { type: 'SET_TEMPLATES'; payload: RecoveryTemplate[] }
    | { type: 'SET_FUNCTION_PARAMETERS'; payload: FunctionParameter[] }
    | { type: 'SET_TRANSACTION_PREVIEW'; payload: TransactionPreview | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SUCCESS_MESSAGE'; payload: { transactionHash: string; explorerUrl: string } | null };

const initialState: State = {
  templates: [],
  functionParameters: [],
  transactionPreview: null,
  loading: false,
  error: null,
  successMessage: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'SET_FUNCTION_PARAMETERS':
      return { ...state, functionParameters: action.payload };
    case 'SET_TRANSACTION_PREVIEW':
      return { ...state, transactionPreview: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SUCCESS_MESSAGE':
      return { ...state, successMessage: action.payload };
    default:
      return state;
  }
};

export const useTransactionBuilder = (config: TransactionBuilderConfig) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load recovery templates on mount
  useEffect(() => {
    const recoveryTemplates = getRecoveryTemplates();
    dispatch({ type: 'SET_TEMPLATES', payload: recoveryTemplates });
  }, []);

  // Update function parameters when function changes
  const updateFunctionParameters = useCallback(() => {
    if (config.functionName && config.abi.length > 0) {
      const builder = createTransactionBuilder(config);
      const parameters = builder.getFunctionParameters(config.functionName);
      dispatch({ type: 'SET_FUNCTION_PARAMETERS', payload: parameters });
    } else {
      dispatch({ type: 'SET_FUNCTION_PARAMETERS', payload: [] });
    }
  }, [config]);

  useEffect(() => {
    updateFunctionParameters();
  }, [updateFunctionParameters]);

  return {
    ...state,
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setTransactionPreview: (preview: TransactionPreview | null) =>
      dispatch({ type: 'SET_TRANSACTION_PREVIEW', payload: preview }),
    setSuccessMessage: (successMessage: { transactionHash: string; explorerUrl: string } | null) =>
      dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: successMessage }),
  };
};
