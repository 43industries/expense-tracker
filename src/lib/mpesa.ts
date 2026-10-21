import type { DefaultCategory } from '@/types/expense';

export type ParsedMpesa = {
  /** M-Pesa transaction code, e.g. "QJK1ABC2DE". Unique per transaction. */
  code: string;
  amountKes: number;
  feeKes: number | null;
  counterparty: string;
  /** ISO 8601 timestamp of the transaction. */
  date: string;
  category: DefaultCategory;
};

const AMOUNT = 'Ksh\\s?([\\d,]+(?:\\.\\d{1,2})?)';
const CODE_RE = /\b([A-Z0-9]{10})\s+Confirmed\b/i;
const DATE_RE = /\bon (\d{1,2})\/(\d{1,2})\/(\d{2,4}) at (\d{1,2}):(\d{2})\s?([AP]M)/i;
const FEE_RE = new RegExp(`Transaction cost,?\\s*${AMOUNT}`, 'i');
const RECEIVED_RE = /\byou have received\b|\breceived Ksh/i;

const SENT_RE = new RegExp(`${AMOUNT} sent to (.+?)(?: for account .+?)? on \\d`, 'i');
const PAID_RE = new RegExp(`${AMOUNT} paid to (.+?)\\.? on \\d`, 'i');
const AIRTIME_RE = new RegExp(`You bought ${AMOUNT} of airtime`, 'i');
const WITHDRAW_RE = new RegExp(`Withdraw ${AMOUNT} from (.+?)(?:\\s+New M-?PESA|\\.\\s|$)`, 'i');

const CATEGORY_KEYWORDS: [DefaultCategory, RegExp][] = [
  ['Bills', /\b(kplc|zuku|safaricom|airtel|airtime|faiba|nairobi water|dstv|gotv|startimes|home fibre|nhif|sha)\b/i],
  ['Transport', /\b(uber|bolt|little|faras|shell|total|rubis|petrol|fuel|matatu|sacco|parking)\b/i],
  ['Food', /\b(java|kfc|chicken inn|pizza|cafe|restaurant|hotel|butchery|artcaffe|glovo)\b/i],
  ['Shopping', /\b(naivas|carrefour|quickmart|chandarana|magunas|cleanshelf|jumia|kilimall|supermarket)\b/i],
  ['Fun', /\b(netflix|showmax|spotify|cinema|imax|betika|sportpesa)\b/i],
];

const toNumber = (s: string) => Number(s.replace(/,/g, ''));

function titleCase(s: string): string {
  return s
    .trim()
    .replace(/\.$/, '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseDate(text: string): string {
  const m = DATE_RE.exec(text);
  if (!m) return new Date().toISOString();
  const [, d, mo, y, h, min, ampm] = m;
  const year = y.length === 2 ? 2000 + Number(y) : Number(y);
  let hour = Number(h) % 12;
  if (ampm.toUpperCase() === 'PM') hour += 12;
  return new Date(year, Number(mo) - 1, Number(d), hour, Number(min)).toISOString();
}

export function guessCategory(counterparty: string): DefaultCategory {
  for (const [category, re] of CATEGORY_KEYWORDS) {
    if (re.test(counterparty)) return category;
  }
  return 'Other';
}

/** Parses an outgoing M-Pesa confirmation SMS. Returns null for incoming money or unrecognised text. */
export function parseMpesaSms(raw: string): ParsedMpesa | null {
  const text = raw.replace(/\s+/g, ' ').trim();
  const code = CODE_RE.exec(text)?.[1]?.toUpperCase();
  if (!code || RECEIVED_RE.test(text)) return null;

  let amount: string | undefined;
  let counterparty: string | undefined;

  const sent = SENT_RE.exec(text);
  const paid = PAID_RE.exec(text);
  const airtime = AIRTIME_RE.exec(text);
  const withdraw = WITHDRAW_RE.exec(text);

  if (sent) {
    amount = sent[1];
    counterparty = titleCase(sent[2].replace(/\s+(?:\+?254|0)[\d*]{9}$/, ''));
  } else if (paid) {
    amount = paid[1];
    counterparty = titleCase(paid[2]);
  } else if (airtime) {
    amount = airtime[1];
    counterparty = 'Airtime';
  } else if (withdraw) {
    amount = withdraw[1];
    const agent = withdraw[2].split(' - ').slice(1).join(' - ');
    counterparty = agent ? `Cash withdrawal (${titleCase(agent)})` : 'Cash withdrawal';
  }

  if (!amount || !counterparty) return null;
  const amountKes = toNumber(amount);
  if (!(amountKes > 0)) return null;

  const fee = FEE_RE.exec(text);

  return {
    code,
    amountKes,
    feeKes: fee ? toNumber(fee[1]) : null,
    counterparty: counterparty.slice(0, 60),
    date: parseDate(text),
    category: guessCategory(counterparty),
  };
}
