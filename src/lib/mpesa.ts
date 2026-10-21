import type { DefaultCategory, ExpenseKind } from '@/types/expense';

export type ParsedMpesa = {
  /** M-Pesa transaction code, e.g. "QJK1ABC2DE". Unique per transaction. */
  code: string;
  amountKes: number;
  feeKes: number | null;
  counterparty: string;
  /** ISO 8601 timestamp of the transaction. */
  date: string;
  category: DefaultCategory;
  /** Whether this money left (expense) or arrived in (income) the account. */
  kind: ExpenseKind;
  /** For reversals: the transaction code of the original payment being refunded. */
  originalCode?: string;
};

const AMOUNT = 'Ksh\\s?([\\d,]+(?:\\.\\d{1,2})?)';
const CODE_RE = /\b([A-Z0-9]{10})\s+Confirmed\b/i;
const DATE_RE = /\bon (\d{1,2})\/(\d{1,2})\/(\d{2,4}) at (\d{1,2}):(\d{2})\s?([AP]M)/i;
const FEE_RE = new RegExp(`Transaction cost,?\\s*${AMOUNT}`, 'i');
// Covers person-to-person, business/salary, bank-to-M-Pesa and M-Shwari credits,
// which all use the "received Ksh... from <sender>" wording.
const RECEIVED_RE = new RegExp(
  `(?:you have received|received)\\s+${AMOUNT} from (.+?)(?: for account .+?)? on \\d`,
  'i',
);
const REVERSAL_RE = /\brevers(?:al|ed|e)\b/i;
const ORIGINAL_CODE_RES = [
  /\btransaction\s+([A-Z0-9]{10})\b[^.]*\brevers/i,
  /\breversal (?:of|for) (?:transaction\s+)?([A-Z0-9]{10})/i,
  /\breversed (?:transaction\s+)?([A-Z0-9]{10})/i,
];
const CREDITED_RE = new RegExp(`${AMOUNT} (?:has been )?credited`, 'i');

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

/** Sender/recipient cleanup shared by "sent to" and "received from": drop a trailing phone number. */
function cleanName(s: string): string {
  return titleCase(s.replace(/\s+(?:\+?254|0)[\d*]{7,}$/, ''));
}

/** First Ksh amount that is not the "New M-PESA balance is Ksh..." figure. */
function firstAmount(text: string): string | undefined {
  const re = new RegExp(AMOUNT, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (!/balance is\s*$/i.test(text.slice(Math.max(0, m.index - 20), m.index))) return m[1];
  }
  return undefined;
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

/**
 * Parses an M-Pesa confirmation SMS, incoming or outgoing.
 * Returns null for unrecognised text. Reversals are returned as income
 * with `originalCode` pointing at the payment they refund.
 */
export function parseMpesaSms(raw: string): ParsedMpesa | null {
  const text = raw.replace(/\s+/g, ' ').trim();
  const code = CODE_RE.exec(text)?.[1]?.toUpperCase();
  if (!code) return null;

  // Reversals first: they often also contain "received"/"credited" wording,
  // and must not be mistaken for a plain incoming payment.
  if (REVERSAL_RE.test(text)) {
    let originalCode: string | undefined;
    for (const re of ORIGINAL_CODE_RES) {
      const candidate = re.exec(text)?.[1]?.toUpperCase();
      if (candidate && candidate !== code) {
        originalCode = candidate;
        break;
      }
    }
    const amount =
      RECEIVED_RE.exec(text)?.[1] ?? CREDITED_RE.exec(text)?.[1] ?? firstAmount(text);
    const amountKes = amount ? toNumber(amount) : 0;
    if (!(amountKes > 0)) return null;
    return {
      code,
      amountKes,
      feeKes: null,
      counterparty: 'M-Pesa reversal',
      date: parseDate(text),
      category: 'Other',
      kind: 'income',
      originalCode,
    };
  }

  const received = RECEIVED_RE.exec(text);
  if (received) {
    const amountKes = toNumber(received[1]);
    if (!(amountKes > 0)) return null;
    return {
      code,
      amountKes,
      feeKes: null,
      counterparty: cleanName(received[2]).slice(0, 60),
      date: parseDate(text),
      // Income sources don't map to expense categories; user can change it in the form.
      category: 'Other',
      kind: 'income',
    };
  }

  let amount: string | undefined;
  let counterparty: string | undefined;

  const sent = SENT_RE.exec(text);
  const paid = PAID_RE.exec(text);
  const airtime = AIRTIME_RE.exec(text);
  const withdraw = WITHDRAW_RE.exec(text);

  if (sent) {
    amount = sent[1];
    counterparty = cleanName(sent[2]);
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
    kind: 'expense',
  };
}
