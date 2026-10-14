export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#F4F6F8',
    card: '#FFFFFF',
    border: '#E3E7EB',
    primary: '#208AEF',
    onPrimary: '#FFFFFF',
    danger: '#E5484D',
    success: '#30A46C',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#0B0D0E',
    card: '#1A1D1F',
    border: '#2B2F31',
    primary: '#3B9EFF',
    onPrimary: '#FFFFFF',
    danger: '#FF6369',
    success: '#3DD68C',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = 14;

export const MONTHLY_BUDGET_USD = 1000;
