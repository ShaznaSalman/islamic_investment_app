# Islamic Investment App

## بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم

Shariah-compliant investment management — Mudarabah, Musharakah, Qard Hassan, and Murabahah.

---

## Project Structure

```
Islamic_Investment_App/
├── src/
│   ├── app/           # Pages + API routes
│   ├── components/
│   ├── hooks/
│   └── lib/           # Prisma, auth, email, server logic
├── prisma/            # Database schema & migrations
├── public/
│   └── uploads/       # Uploaded documents
├── package.json
└── .env
```

## Quick Start

### Prerequisites
- Node.js 18+
- [Supabase](https://supabase.com) account with a **PostgreSQL** database (this app does not use MySQL)

### Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and set your Supabase credentials:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase **pooler** connection (port 6543, for the running app) |
| `DIRECT_URL` | Supabase **direct** connection (port 5432, for Prisma migrations) |
| `JWT_SECRET` | Random secret for login tokens |

Run migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@iia.com | Admin@12345 |
| Recipient | recipient@iia.com | Recipient@123 |

---

## Deploy

Single Next.js app — deploy to **Vercel**, **Railway**, or **Render** with:
- `DATABASE_URL` → Supabase pooler connection
- `DIRECT_URL` → Supabase direct connection (for migrations)
- `JWT_SECRET` → random secret string

Build command: `npm run build`  
Start command: `npm start`

### Automated notifications

Set `CRON_SECRET` in `.env`, then schedule a daily POST:

```bash
curl -X POST https://your-app.com/api/cron/notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or use **Settings → System → Run notification check now** (owner only).

This sends due-soon (7-day) and overdue alerts, and marks overdue investments as `DEFAULTED`.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| App | Next.js 16, TypeScript, Tailwind CSS |
| Database | PostgreSQL (Supabase) via Prisma |
| Auth | JWT |
| UI | React Query, Recharts, react-hook-form |

---

وَاللَّهُ خَيْرُ الرَّازِقِين — *"And Allah is the Best of Providers"* — Surah Al-Jumu'ah 62:11
