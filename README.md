# LA FRUTA

A Next.js workspace for managing LA FRUTA's produce customers, orders, invoices, and delivery routes.

## Authentication

The whole workspace is private. A `proxy.ts` gate redirects unauthenticated visitors to `/login`, and the
`/api/*` routes independently return `401` (the proxy does not run on them). Sign-in uses a single shared
password held in `ADMIN_PASSWORD`; the session is a signed JWT in an `httpOnly` cookie that expires after 7 days.

## Setup

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
openssl rand -base64 32   # use this for SESSION_SECRET
```

`SESSION_SECRET` and `ADMIN_PASSWORD` are both required — sign-in fails without them. Set the same two
variables in the Vercel project (Production, Preview, and Development) before deploying.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```
