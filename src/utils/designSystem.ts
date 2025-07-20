// Design System Constants
export const COLORS = {
  // Backgrounds
  background: {
    primary: 'bg-surface-default',
    secondary: 'bg-surface-raised',
    tertiary: 'bg-surface-sunken',
  },

  // Text
  text: {
    primary: 'text-white',
    secondary: 'text-text-secondary',
    muted: 'text-grey-500',
  },

  // Borders
  border: {
    default: 'border-grey-700',
    disabled: 'border-border-disabled',
  },

  // Buttons
  button: {
    primary: 'bg-cta-default text-white cursor-pointer',
    secondary: 'bg-cta-default text-white cursor-pointer',
    tertiary: 'bg-surface-default text-text-secondary cursor-pointer',
    disabled: 'bg-cta-disabled text-grey-400 cursor-not-allowed',
    menu: {
      default: 'text-text-secondary',
      active: 'bg-surface-raised text-white font-bold',
      disabled: 'text-gray-400 cursor-not-allowed',
    },
  },

  // Feedback
  feedback: {
    success: 'text-feedback-success',
    error: 'text-feedback-error',
  },
} as const;

export const SPACING = {
  // Mobile-first spacing
  xs: 'p-2 md:p-3',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
  xl: 'p-8 md:p-12',
} as const;

export const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

// Simple responsive utilities
export const RESPONSIVE = {
  // Typography
  text: {
    h1: 'text-2xl md:text-3xl lg:text-4xl',
    h2: 'text-xl md:text-2xl lg:text-3xl',
    h3: 'text-lg md:text-xl lg:text-2xl',
    body: 'text-sm md:text-base',
  },

  // Grid columns
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-1 sm:grid-cols-2',
    cols3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },

  // Touch-friendly
  touch: 'min-h-[44px] min-w-[44px]',
} as const;

// Breakpoint utilities - references CSS custom properties from theme.css
export const BREAKPOINTS = {
  'xs': 'var(--breakpoint-xs)',
  'sm': 'var(--breakpoint-sm)',
  'md': 'var(--breakpoint-md)',
  'lg': 'var(--breakpoint-lg)',
  'xl': 'var(--breakpoint-xl)',
  '2xl': 'var(--breakpoint-2xl)',
} as const;

// Common responsive patterns
export const PATTERNS = {
  // Card layout
  card: `
    ${COLORS.background.secondary}
    ${SPACING.md}
    ${BORDER_RADIUS.lg}
    border ${COLORS.border.default}
    shadow-sm
  `,

  // Button styles
  button: {
    primary: `
      ${COLORS.button.primary}
      ${RESPONSIVE.touch}
      ${BORDER_RADIUS.md}
      font-medium
      transition-colors
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    `,
    secondary: `
      ${COLORS.button.secondary}
      ${RESPONSIVE.touch}
      ${BORDER_RADIUS.md}
      font-medium
      transition-colors
      focus:outline-none focus:ring-2 focus:ring-grey-500 focus:ring-offset-2
    `,
  },

  // Form elements
  form: {
    input: `
      ${RESPONSIVE.touch}
      ${COLORS.background.tertiary}
      ${COLORS.text.primary}
      ${BORDER_RADIUS.md}
      border ${COLORS.border.default}
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    `,
    label: `
      ${COLORS.text.secondary}
      ${RESPONSIVE.text.body}
      font-medium
      block mb-2
    `,
  },
} as const;
