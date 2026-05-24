# Islamic Investment App

## بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم

Shariah-compliant investment management for Mudarabah, Musharakah, Qard Hassan, and Murabahah.

---

## Features

- Owner and recipient login with JWT authentication
- Role-based dashboards and access control
- Investment creation, repayment tracking, documents, reports, and notifications
- Profit-share, projected return, purification, and Murabahah installment calculators
- OMR primary currency with optional USD equivalent display
- Database-backed currency and notification settings
- Purification tracker and Shariah advisor notes
- PDF and Excel report exports

## Project Structure

```text
Islamic_Investment_App/
├── src/
│   ├── app/           # Pages and API routes
│   ├── components/
│   ├── hooks/
│   └── lib/           # Prisma, auth, email, server logic
├── prisma/            # Database schema and migrations
├── public/
│   └── uploads/       # Local uploaded documents fallback
├── scripts/
├── package.json
└── .env.local
```

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account with a PostgreSQL database

### Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and set your credentials:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase pooler connection, usually port `6543`, for the running app |
| `DIRECT_URL` | Supabase direct connection, usually port `5432`, for Prisma migrations |
| `JWT_SECRET` | Random secret for login tokens |
| `CRON_SECRET` | Secret for scheduled notification checks |
| `NEXT_PUBLIC_APP_URL` | App URL used in email links |
| `NEXT_PUBLIC_USD_EXCHANGE_RATE` | Default OMR to USD rate before owner settings are saved |

Optional Supabase storage and email variables are listed in `.env.example`.

Run migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

If Prisma's migration engine cannot run against the remote database, the settings migration can be applied with:

```bash
node -r ./scripts/load-env-local.js scripts/apply-settings-migration.js
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Default Credentials

Available after seeding:

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@iia.com` | `Admin@12345` |
| Recipient | `recipient@iia.com` | `Recipient@123` |

---

## Deploy

Deploy as a single Next.js app to Vercel, Railway, Render, or another Node-compatible platform.

Required production variables:

- `DATABASE_URL` - Supabase pooler connection
- `DIRECT_URL` - Supabase direct connection for migrations
- `JWT_SECRET` - long random secret
- `CRON_SECRET` - long random secret
- Supabase storage variables, if using cloud uploads
- SMTP variables, if sending password reset and reminder emails

Build command:

```bash
npm run build
```

Start command:

```bash
npm start
```

### Automated Notifications

Set `CRON_SECRET`, then schedule a daily POST:

```bash
curl -X POST https://your-app.com/api/cron/notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Owners can also use **Settings > System > Run notification check now**.

This sends due-soon and overdue alerts, respects saved notification preferences, and marks overdue active investments as `DEFAULTED`.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| App | Next.js 16, TypeScript, Tailwind CSS |
| Database | PostgreSQL via Prisma |
| Auth | JWT |
| Storage | Supabase Storage with local fallback |
| UI | React Query, Recharts, react-hook-form |
| Export | jsPDF and xlsx |

---

وَاللَّهُ خَيْرُ الرَّازِقِينَ - "And Allah is the Best of Providers" - Surah Al-Jumu'ah 62:11
