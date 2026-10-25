# 🦴 Rifa Día de Muertos — Takumi Robotics × LIKS

Raffle site for **Takumi Robotics** and **LIKS Compañía de Teatro**: 100 tickets, $50 MXN each,
prize = a laser-cut **Día de Muertos altar**. Built with Next.js 16, shadcn/ui (base-nova,
amber/mauve preset `b3kJBQZay`), Better Auth, Drizzle ORM and Neon.
Runs on **Bun**.

---

## ✨ Features

- **Landing page** (Día de Muertos themed: papel picado, cempasúchil, catrinas, floating petals)
  with a big **“Regístrate YA”** CTA.
- **Accounts with Better Auth**
  - Email + password sign-up. Emails require a **6-digit code** sent to the inbox
    (email OTP verification — no links).
  - Full name field (never verified, can be a username).
  - Google, GitHub and Apple sign-in (shown only when configured).
- **User dashboard**
  - Live grid of the 100 tickets (available / selected / yours / taken).
  - Buy tickets: pick numbers → choose payment method.
  - **Tarjeta / QR**: shows the QR to scan; upload a proof picture.
  - **Transferencia**: shows bank details + **CLABE** (copy-to-clipboard); upload a proof picture.
  - **Efectivo**: only an admin can mark it as paid.
  - Cancel an un-paid order (tickets are released).
- **Admin panel** (`/admin`, credentials `admin` / `4dmiN123*` by default)
  - Statistics: money collected / pending / expected, tickets sold & remaining, per-method breakdown.
  - Payments: view proofs, **two-step verification** (Revisión 1 → Marcar como pagado) for
    card/transfer, single-step for cash, cancel & release.
  - Tickets map with owner (name + email).
  - Users ledger: how many tickets each user has, **how much they owe** and **how much they
    already paid** (supports buy → pay → buy again).
  - Settings: set the **QR image** for card payments and the **bank details / CLABE** for transfers.

---

## 🚀 Quick start (local, no cloud needed)

The app works with a real Postgres (Neon) **or** with a local PGlite database
(a real Postgres compiled to WebAssembly) when `DATABASE_URL` is empty.

```bash
# 1) install deps
bun install

# 2) configure env
cp .env.example .env
# edit .env as you like

# 3) create tables + seed (100 tickets, settings row, admin user)
bun run db:setup

# 4) run dev
bun run dev
```

Open http://localhost:3000 🎃

> The seeded admin logs in at `/admin` with `admin` / `4dmiN123*`.
> **Change it:** set `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` in `.env`
> and run `bun run db:setup` again.

> 💬 In development, verification codes are **printed to the server console**
> (the `📧 [DEV EMAIL → …]` block) because no email provider is configured yet.
> Add `RESEND_API_KEY` to send real emails.

---

## ☁️ Production (Neon + Vercel)

1. **Create a Neon database** (https://neon.tech) and copy the connection string.
2. **Push schema + seed** into Neon:

   ```bash
   DATABASE_URL="postgresql://…" bun run db:setup
   ```

3. Deploy to Vercel:

   - Framework preset: **Next.js** (Bun is detected automatically — add
     `"installCommand": "bun install"` if needed).
   - Add all environment variables from `.env.example` to the project:
     `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`),
     `BETTER_AUTH_URL=https://tu-dominio.com`, `ADMIN_*`, `RESEND_API_KEY`, provider keys.
   - After first deploy run `bun run db:setup` once more against production Neon
     (or let the seed run manually).

### Env variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon Postgres URL. Empty → local PGlite. |
| `BETTER_AUTH_SECRET` | Better Auth secret (≥32 chars). `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Public base URL of the app. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` | Admin panel login + seeded account. |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional — real email delivery for verification codes. |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `APPLE_CLIENT_ID/SECRET` | OAuth apps. Empty = button hidden. |

### OAuth setup

- **Google**: https://console.cloud.google.com → OAuth consent screen.
  Authorized redirect URI: `https://tu-dominio.com/api/auth/callback/google`.
- **GitHub**: https://github.com/settings/developers → callback
  `https://tu-dominio.com/api/auth/callback/github`.
- **Apple**: Sign in with Apple (needs a paid Apple Developer account). Callback
  `https://tu-dominio.com/api/auth/callback/apple`.

### Email

Codes are sent through **Resend** when `RESEND_API_KEY` is set. Swap `lib/email.ts`
for any other provider (SMTP etc.) if you prefer.

---

## 🧰 Useful commands

```bash
bun run dev          # dev server
bun run build        # production build
bun run lint         # eslint
bun run db:setup     # generate migrations + apply + seed (dev DB or DATABASE_URL)
bun run db:generate  # drizzle-kit generate (new migration)
bun run db:studio    # drizzle studio to browse the database
```

---

## 🗂️ Project structure

```
app/
  page.tsx            # landing page
  login/ signup/ verify-email/
  dashboard/          # user dashboard (tickets, buy flow, payments)
  admin/              # admin panel + admin login
  api/auth/[...all]/  # Better Auth route handler
components/
  auth/               # sign up / login / verify-email / logout
  dashboard/          # ticket grid, orders, payment instructions
  admin/              # stats, payments, tickets, users, settings tabs
  dia/                # Día de Muertos decorations (marigold, papel picado…)
  ui/                 # shadcn/ui components (base-nova)
lib/
  auth.ts             # Better Auth server config (email OTP + social + admin)
  actions.ts          # server actions (buy, proofs, admin verification…)
  queries.ts          # data access layer
  db/                 # drizzle schema, lazy DB factory (Neon | PGlite)
```

## 🧾 Payment states

```
purchase created ─ pending ─┬─ cash ────────────► admin: "Marcar como pagado" ─► paid
                            └─ card/transfer ──► user uploads proof ─ in_review
                                                ► admin: "Revisión 1" ─ verified
                                                ► admin: "Marcar como pagado" ─► paid
(any non-paid order can be cancelled → tickets released back to available)
```

Tickets use an optimistic `UPDATE … WHERE status = 'available'` guard, so two buyers can’t
claim the same number at the same time.