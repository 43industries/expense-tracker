# Expense Tracker

React Native (Expo SDK 57, TypeScript, Expo Router) expense tracker built in four phases for the
React Native Intern Program.

| Phase | Features |
| --- | --- |
| 1. Basics | Balance card, recent expenses, validated add-expense form |
| 2. Lists and navigation | Tabs, searchable `FlatList`, delete, edit screen, data saved with AsyncStorage |
| 3. Real data | Zustand stores, monthly totals chart, dark mode, USD to KES with TanStack Query |
| 4. Ship it | Receipt photos, swipe-to-delete animation, Supabase login + cloud sync, EAS build |

## Run it on your phone

1. Install **Expo Go** from the Play Store / App Store.
2. In this folder:

   ```bash
   npm install
   ```

3. Start the dev server:

   - **Same Wi-Fi** as your computer:

     ```bash
     npm start
     ```

   - **Other networks** (different Wi-Fi or mobile data):

     ```bash
     npm run start:tunnel
     ```

4. Scan the QR code (Android: from Expo Go; iPhone: with the Camera app).

**Windows note (tunnel):** if `npm run start:tunnel` fails with `Received null` or
`ngrok.exe ENOENT`, Windows Defender has quarantined Expo’s ngrok binary.

1. Open **Windows Security → Virus & threat protection → Protection history**.
2. Find the blocked `ngrok.exe`, choose **Restore** / **Allow**.
3. Prefer an exclusion for
   `node_modules\@expo\ngrok-bin-win32-x64` (run PowerShell as Administrator if needed).
4. Restore the binary, then start the tunnel:

   ```bash
   npm run restore:ngrok
   npm run start:tunnel
   ```

Without Supabase keys the app runs **local-only**: no login screen, data stays on the phone.

## Turn on login and cloud sync (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates
   the `expenses` table, row-level security (each user only sees their own rows) and a private
   `receipts` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in the values from
   **Project Settings > API**.
4. Restart `npx expo start`. The app now opens on the login screen.

Supabase requires email confirmation by default. For quick testing you can turn it off under
**Authentication > Sign In / Providers > Email**.

### Forgot password setup

The **Forgot password?** link on the login screen emails a reset link that deep-links back
into the installed app (`expensetracker://reset-password`). For that link to be accepted:

1. In the Supabase dashboard open **Authentication > URL Configuration**. Current live
   values (verified 21 Oct 2026): **Redirect URLs** contains `expensetracker://**`,
   `expensetracker://reset-password` and `expensetracker:///reset-password`;
   **Site URL** is `http://localhost:3000`, which is only a fallback for redirects that
   match no allow-list entry. All three redirect entries matter: APKs built before the
   fix generate `expensetracker:///reset-password` (triple slash — `Linking.createURL`
   produces an empty-host URL in standalone builds), which matches neither the
   double-slash entry nor the host-position wildcard, so Supabase silently fell back
   to the Site URL and phones tried to open `localhost:3000`. Current code sends the
   literal `expensetracker://reset-password` instead; keep the triple-slash entry for
   old APKs still in the field.
2. Under **Authentication > Emails**, confirm the **Reset password** template is enabled.
   This project uses the default templates (no custom SMTP), which link via
   `{{ .ConfirmationURL }}` and therefore honour the app's `redirectTo`.
3. Rebuild/reinstall the app (the `expensetracker` scheme only works in an installed
   EAS/development build, not Expo Go). Tapping the email link opens the reset screen;
   expired or already-used links show an error with a path back to sign-in.

## Add expenses from M-Pesa SMS

Safaricom has no API for personal M-Pesa accounts and iOS doesn't let apps read SMS, so the app
reads the confirmation message text instead. It understands money you **sent**, **paid** (Paybill
and Till), **airtime** and **agent withdrawals**, plus money you **received** — from another
person, a business or salary payment, a bank transfer, or an M-Shwari credit. Outgoing messages
are filled in as expenses with a guessed category; incoming messages are filled in as income
with the sender as the title and category **Other** (change it in the form if you like). A
**reversal** that refunds a payment you already added is flagged with a link to the original
entry instead of being booked as new income, so it isn't double-counted; a reversal whose
original payment isn't in the app is booked as income. The amount, counterparty, transaction
date and category are filled in for you, and the M-Pesa code (e.g. `QJK1ABC2DE`) stops the
same message being added twice.

**Paste (iPhone and Android):** copy the M-Pesa SMS, open **Add expense**, expand
**From M-Pesa SMS** and tap **Paste**. Check the form, then tap **Add expense**.

**Automatic on iPhone (Shortcuts):** opens the app with the message already filled in every time
an M-Pesa SMS arrives.

1. Open **Shortcuts > Automation**, tap **+**, choose **Message**.
2. Set **Sender** to `MPESA`, choose **Run Immediately**, tap **Next**, then **New Blank Automation**.
3. Add **URL Encode** and set its input to **Shortcut Input** (the message content).
4. Add **Text** with `expensetracker://add?sms=` followed by the **URL Encoded Text** variable.
5. Add **Open URLs** with the **Text** from step 4.

`expensetracker://` only works in an installed build (EAS). While testing in Expo Go, use
`exp://<laptop-ip>:8081/--/add?sms=` in step 4 instead, for example
`exp://172.20.10.2:8081/--/add?sms=`.

If your Supabase database was created before this feature, run this once in the SQL Editor:

```sql
alter table public.expenses add column if not exists mpesa_code text;
create unique index if not exists expenses_user_mpesa_code_idx
  on public.expenses (user_id, mpesa_code) where mpesa_code is not null;
```

If your database was created before income/notes support, also run:

```sql
alter table public.expenses add column if not exists kind text not null default 'expense';
alter table public.expenses add column if not exists notes text;
```

## Build an installable APK (EAS Build)

```bash
npm install -g eas-cli
eas login
eas init           # links the project to your Expo account
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment preview
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <key> --environment preview
eas build -p android --profile preview
```

When it finishes, open the link on your phone to download and install the APK.

## Project structure

```
src/
  app/                 Expo Router screens (file name = route)
    _layout.tsx        providers, theme, login guard, auto sync
    login.tsx
    add.tsx            add-expense modal
    expense/[id].tsx   edit screen (receives only the id)
    (tabs)/            Home, Expenses, Stats, Settings
  components/          BalanceCard, ExpenseRow, ExpenseForm, ReceiptPicker, SwipeableRow, ...
  store/               Zustand stores: expenses, settings, auth
  hooks/               useColors (theme), useMoney (currency), useAutoSync
  lib/                 supabase client, SecureStore adapter, sync, currency API, stats helpers
supabase/schema.sql    database + storage setup
```

### How data flows

- Every amount is stored in **USD**. `useMoney()` converts to KES only for display, and the form
  converts what you type back to USD.
- Monthly totals and the balance are **derived** from the expense list with `useMemo`, never stored.
- The expense store is persisted to AsyncStorage. Local changes are recorded in `dirty` / `deleted`
  lists; `syncExpenses()` pushes those to Supabase, uploads receipt photos, then pulls the cloud
  copy. It runs after login, 1.5 s after a change, and when the app returns to the foreground.

## Self-check answers

**Phase 1: why does the screen update after `setAmount(5)` but not after `amount = 5`?**
`setAmount` tells React the state changed, so React re-runs the component with the new value.
`amount = 5` only changes a local variable inside one render; React doesn't know about it, and
on the next render the variable is recreated from state anyway.

**Phase 2: what happens if you forget the dependency array in `useEffect`?**
The effect runs after *every* render. If the effect also sets state (like loading expenses), that
causes another render, which runs the effect again: an infinite loop. `[]` means run once after
mount; `[a, b]` means run when `a` or `b` changes.

**Phase 3: what does the user see if the currency API is down, and what should they see?**
Without handling it they'd see a blank or crashed screen, or a stuck spinner. In this app
TanStack Query retries twice, then the app falls back to USD amounts and shows a banner
("Couldn't load KES rates, so amounts are shown in USD") with a **Retry** button.

**Phase 4: why is SecureStore safer than AsyncStorage for a login token?**
AsyncStorage is a plain unencrypted file inside the app's storage; anyone with a backup, a rooted
phone or a debug build can read it. SecureStore saves values in the iOS Keychain / Android
Keystore, which are encrypted with hardware-backed keys. Supabase sessions are larger than
SecureStore's ~2 KB per-value limit, so `src/lib/secure-storage.ts` splits them into chunks.

## Windows note

If `npm install` fails with `ENOTEMPTY` or packages are missing files, the project path is too long
for Windows' 260-character limit. Move the project to a short path like `C:\dev\expense-tracker`,
or enable long paths (run as admin:
`New-ItemProperty -Path HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`).
