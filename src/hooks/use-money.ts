import { useQuery } from '@tanstack/react-query';

import { fetchRates } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { useSettingsStore, type DisplayCurrency } from '@/store/settings';

export function useRates() {
  return useQuery({
    queryKey: ['rates', 'USD'],
    queryFn: fetchRates,
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Amounts are stored in USD. This converts them for display in the user's chosen
 * currency, falling back to USD while rates are loading or unavailable.
 */
export function useMoney() {
  const requested = useSettingsStore((s) => s.currency);
  const rates = useRates();
  const rate = requested === 'KES' ? rates.data?.KES : undefined;
  const currency: DisplayCurrency = rate ? 'KES' : 'USD';
  const factor = rate ?? 1;

  return {
    currency,
    requested,
    rates,
    toDisplay: (usd: number) => usd * factor,
    fromDisplay: (value: number) => value / factor,
    format: (usd: number) => formatMoney(usd * factor, currency),
  };
}
