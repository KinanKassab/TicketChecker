# TicketChecker

Production-ready single-event ticket sales app with referral links, manual payment reconciliation, and QR-based check-in.

## Stack

- Next.js App Router + TypeScript
- Supabase (PostgreSQL)
- TailwindCSS
- Zod validation

## Setup

1) Install dependencies:

```
npm install
```

2) Configure environment variables:

- Copy `.env.example` to `.env` and fill in values.
- You need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.

3) Create the database schema:

- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Run the SQL from `database_SQL/schema.sql`

Alternatively, you can use the Supabase CLI or run it via psql.

4) Run the app:

```
npm run dev
```

App runs at `http://localhost:3000`.

## Admin + Staff Access

- Admin dashboard: `/admin`
- Staff check-in: `/checkin`

Both pages use password gates controlled by `ADMIN_PASSWORD` and `STAFF_PASSWORD` in `.env`.

## Referral Links

Agents are created in `/admin/agents/new` and receive a unique code. Use `/?ref=CODE` on the landing page to attribute orders.

## Payment Flow (Phase 1)

- Orders are created as `PENDING` and require manual confirmation in `/admin`.
- Use "Mark Paid" to confirm and generate commissions.

## Environment Variables

See `.env.example` for required values:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `EVENT_NAME`
- `EVENT_DATE`
- `EVENT_LOCATION`
- `TICKET_PRICE_SYP`
- `SYRIATEL_MERCHANT_NUMBER`
- `MTN_MERCHANT_NUMBER`
- `ADMIN_PASSWORD`
- `STAFF_PASSWORD`
- `BASE_URL`

## Database Setup

The app uses Supabase (PostgreSQL). To set up:

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Settings > API
3. Run the SQL schema from `database_SQL/schema.sql` in the SQL Editor

The schema includes:
- `agents` - Referral agents
- `orders` - Payment orders
- `tickets` - Generated tickets
- `commissions` - Agent commissions
- `ticket_counter` - Sequential ticket numbering
