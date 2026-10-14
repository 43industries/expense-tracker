const RATES_URL = 'https://open.er-api.com/v6/latest/USD';

export type Rates = {
  KES: number;
  updatedAt: string;
};

type ApiResponse = {
  result: 'success' | 'error';
  time_last_update_utc?: string;
  rates?: Record<string, number>;
  'error-type'?: string;
};

export async function fetchRates(): Promise<Rates> {
  const res = await fetch(RATES_URL);
  if (!res.ok) throw new Error(`Rate service returned ${res.status}`);

  const json = (await res.json()) as ApiResponse;
  const kes = json.rates?.KES;
  if (json.result !== 'success' || typeof kes !== 'number') {
    throw new Error(json['error-type'] ?? 'Unexpected response from rate service');
  }
  return { KES: kes, updatedAt: json.time_last_update_utc ?? new Date().toUTCString() };
}
