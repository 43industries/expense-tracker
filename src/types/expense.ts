export const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Fun', 'Other'] as const;

export type Category = (typeof CATEGORIES)[number];

export type Expense = {
  id: string;
  title: string;
  /** Always stored in USD; converted only for display. */
  amount: number;
  category: Category;
  /** ISO 8601 timestamp. */
  date: string;
  /** Photo on this device (from the camera or library). */
  receiptUri?: string;
  /** Path of the uploaded photo in the Supabase `receipts` bucket. */
  receiptPath?: string;
};

export type ExpenseInput = Pick<
  Expense,
  'title' | 'amount' | 'category' | 'receiptUri' | 'receiptPath'
>;
