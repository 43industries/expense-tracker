import { RECEIPTS_BUCKET, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useExpenseStore } from '@/store/expenses';
import type { Category, Expense } from '@/types/expense';

type ExpenseRow = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  receipt_path: string | null;
};

const toRow = (e: Expense, userId: string): ExpenseRow => ({
  id: e.id,
  user_id: userId,
  title: e.title,
  amount: e.amount,
  category: e.category,
  date: e.date,
  receipt_path: e.receiptPath ?? null,
});

const fromRow = (r: ExpenseRow): Expense => ({
  id: r.id,
  title: r.title,
  amount: Number(r.amount),
  category: r.category,
  date: r.date,
  receiptPath: r.receipt_path ?? undefined,
});

async function uploadReceipt(userId: string, expenseId: string, uri: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
  const path = `${userId}/${expenseId}-${Date.now()}.${ext}`;
  const body = await fetch(uri).then((r) => r.arrayBuffer());
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, body, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg' });
  if (error) throw error;
  return path;
}

async function pushDeletes() {
  const { deleted } = useExpenseStore.getState();
  if (deleted.length === 0) return;

  const ids = deleted.map((d) => d.id);
  const { error } = await supabase.from('expenses').delete().in('id', ids);
  if (error) throw error;

  const paths = deleted.flatMap((d) => (d.receiptPath ? [d.receiptPath] : []));
  if (paths.length) await supabase.storage.from(RECEIPTS_BUCKET).remove(paths);

  useExpenseStore.setState((s) => ({ deleted: s.deleted.filter((d) => !ids.includes(d.id)) }));
}

async function pushChanges(userId: string) {
  const { dirty } = useExpenseStore.getState();
  if (dirty.length === 0) return;

  for (const id of dirty) {
    const e = useExpenseStore.getState().expenses.find((x) => x.id === id);
    if (!e?.receiptUri || e.receiptPath) continue;
    const receiptPath = await uploadReceipt(userId, e.id, e.receiptUri);
    useExpenseStore.setState((s) => ({
      expenses: s.expenses.map((x) => (x.id === id ? { ...x, receiptPath } : x)),
    }));
  }

  // Remember exactly what was uploaded so edits made during the request stay dirty.
  const snapshot = useExpenseStore.getState().expenses.filter((e) => dirty.includes(e.id));
  if (snapshot.length) {
    const { error } = await supabase
      .from('expenses')
      .upsert(snapshot.map((e) => toRow(e, userId)));
    if (error) throw error;
  }

  useExpenseStore.setState((s) => ({
    dirty: s.dirty.filter((id) => {
      if (!dirty.includes(id)) return true;
      const current = s.expenses.find((e) => e.id === id);
      return current !== undefined && current !== snapshot.find((e) => e.id === id);
    }),
  }));
}

async function pull() {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, user_id, title, amount, category, date, receipt_path')
    .order('date', { ascending: false });
  if (error) throw error;

  useExpenseStore.setState((s) => {
    const local = new Map(s.expenses.map((e) => [e.id, e]));
    const deletedIds = new Set(s.deleted.map((d) => d.id));

    const merged = (data as ExpenseRow[])
      .filter((r) => !deletedIds.has(r.id) && !s.dirty.includes(r.id))
      .map((r) => {
        const remote = fromRow(r);
        const mine = local.get(r.id);
        // Keep the on-device photo when it is the same one that was uploaded.
        return mine?.receiptUri && mine.receiptPath === remote.receiptPath
          ? { ...remote, receiptUri: mine.receiptUri }
          : remote;
      });
    const pending = s.expenses.filter((e) => s.dirty.includes(e.id));

    return {
      expenses: [...pending, ...merged].sort((a, b) => b.date.localeCompare(a.date)),
      lastSyncedAt: new Date().toISOString(),
    };
  });
}

let running: Promise<void> | null = null;

/** Pushes local changes, then pulls the cloud copy. Safe to call often; calls are coalesced. */
export function syncExpenses(): Promise<void> {
  if (!isSupabaseConfigured) return Promise.resolve();
  if (running) return running;

  running = (async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;

    useExpenseStore.setState({ syncing: true, syncError: null });
    try {
      await pushDeletes();
      await pushChanges(userId);
      await pull();
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      useExpenseStore.setState({ syncError: message });
    } finally {
      useExpenseStore.setState({ syncing: false });
    }
  })().finally(() => {
    running = null;
  });

  return running;
}
