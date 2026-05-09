# BizFlow AI

Smart WhatsApp Automation for Local Businesses — Built FOR India, BY India.

## What is BizFlow AI?

A complete Business Operating System on WhatsApp for salons, clinics, gyms, tuition centers, freelancers, and local shops. Not just a messaging tool — handles bookings, payments, staff, loyalty, reviews, analytics, and customer management.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 + Tailwind CSS + shadcn/ui |
| Mobile | Capacitor (wraps web as native app) + PWA |
| Backend | NestJS + PostgreSQL + Redis + Prisma ORM |
| Real-time | Socket.io |
| AI | OpenAI GPT-4o + Whisper + Google Translate |
| WhatsApp | Meta WhatsApp Business Cloud API |
| Payments | Razorpay + UPI |

## Project Structure

```
bizflow-ai/
├── apps/
│   ├── web/          # Next.js frontend (dashboard)
│   └── api/          # NestJS backend (API + WhatsApp webhooks)
├── packages/
│   └── shared/       # Shared types, constants, utils
└── package.json      # Monorepo root (npm workspaces)
```

## Getting Started

```bash
# Install all dependencies
npm install

# Start development (both frontend + backend)
npm run dev

# Or start individually
npm run dev:web   # Next.js on http://localhost:3000
npm run dev:api   # NestJS on http://localhost:4000
```

## Environment Variables

Copy `.env.example` to `.env` in `apps/api/` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `WHATSAPP_TOKEN` — Meta WhatsApp Business API token
- `WHATSAPP_PHONE_ID` — WhatsApp Business phone number ID
- `WHATSAPP_VERIFY_TOKEN` — Webhook verification token
- `OPENAI_API_KEY` — OpenAI API key
- `RAZORPAY_KEY_ID` — Razorpay key
- `RAZORPAY_KEY_SECRET` — Razorpay secret
