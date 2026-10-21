import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Expense } from '@/types/expense';

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function expensesToCsv(expenses: Expense[]): string {
  const header = ['date', 'title', 'amount_usd', 'kind', 'category', 'notes', 'mpesa_code'];
  const rows = expenses.map((e) =>
    [
      e.date,
      e.title,
      String(e.amount),
      e.kind ?? 'expense',
      e.category,
      e.notes ?? '',
      e.mpesaCode ?? '',
    ]
      .map(escapeCell)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export async function shareExpensesCsv(expenses: Expense[]): Promise<void> {
  const csv = expensesToCsv(expenses);
  const file = new File(Paths.cache, `expenses-${Date.now()}.csv`);
  file.create({ overwrite: true });
  file.write(csv);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export expenses',
    UTI: 'public.comma-separated-values-text',
  });
}
