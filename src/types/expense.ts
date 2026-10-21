export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Fun',
  'Other',
] as const;

/** @deprecated Prefer DEFAULT_CATEGORIES */
export const CATEGORIES = DEFAULT_CATEGORIES;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];
/** @deprecated Prefer string category + DEFAULT_CATEGORIES */
export type Category = DefaultCategory;

export type ExpenseKind = 'expense' | 'income';

export type Expense = {
  id: string;
  title: string;
  /** Always stored in USD; converted only for display. */
  amount: number;
  category: string;
  kind: ExpenseKind;
  /** ISO 8601 timestamp. */
  date: string;
  notes?: string;
  /** Photo on this device (from the camera or library). */
  receiptUri?: string;
  /** Path of the uploaded photo in the Supabase `receipts` bucket. */
  receiptPath?: string;
  /** Transaction code when imported from an M-Pesa SMS; used to block duplicates. */
  mpesaCode?: string;
};

export type ExpenseInput = Pick<
  Expense,
  'title' | 'amount' | 'category' | 'kind' | 'receiptUri' | 'receiptPath'
> &
  Partial<Pick<Expense, 'date' | 'mpesaCode' | 'notes'>>;
