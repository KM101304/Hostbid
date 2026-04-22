# HostBid

HostBid is a production-oriented MVP for a premium, experience-first dating marketplace where users post plans and other users place real-money offers to host them. Offers are authorized immediately with Stripe Payment Intents using manual capture, posters choose the winner manually, the winning offer is captured, other offers are released, and chat unlocks only after selection.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Stripe Payment Intents + optional Stripe Connect destination charges
- Supabase Realtime subscriptions
- Vercel-ready deployment

## Folder structure

```text
.
├── middleware.ts
├── supabase/
│   └── migrations/
│       └── 202604220001_hostbid_schema.sql
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── experiences/
│   │   ├── login/
│   │   ├── messages/
│   │   ├── moderation/
│   │   ├── profile/
│   │   ├── signup/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── bids/
│   │   ├── chat/
│   │   ├── experiences/
│   │   ├── layout/
│   │   ├── profile/
│   │   ├── reports/
│   │   └── ui/
│   └── lib/
│       ├── auth.ts
│       ├── database.types.ts
│       ├── env.ts
│       ├── marketplace.ts
│       ├── queries.ts
│       ├── stripe.ts
│       ├── utils.ts
│       ├── validators.ts
│       └── supabase/
└── .env.example
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
HOSTBID_PLATFORM_FEE_PERCENT=15
```

## Supabase setup

1. Create a Supabase project.
2. Enable Email auth and any OAuth providers you want, such as Google.
3. Run the SQL migration in `supabase/migrations/202604220001_hostbid_schema.sql`.
4. In Supabase Realtime, enable replication for `bids` and `messages`.
5. Configure your site URL and auth redirect URL:
   - `http://localhost:3000`
   - `http://localhost:3000/api/auth/callback`

## Stripe setup

1. Create a Stripe account and obtain your API keys.
2. Add a webhook endpoint pointing to `http://localhost:3000/api/stripe/webhooks`.
3. Subscribe to:
   - `payment_intent.canceled`
   - `payment_intent.payment_failed`
4. For automatic host payout split, store a connected account ID on the poster profile.
   - If no Connect account is present, winning funds still capture to the platform account.

## Local development

```bash
npm install
npm run dev
```

Optional checks:

```bash
npm run lint
npm run typecheck
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, click `Add New Project` and import the repository.
3. Keep the default framework preset as `Next.js`.
4. In the Vercel project settings, add these environment variables for `Production` and `Preview`:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `HOSTBID_PLATFORM_FEE_PERCENT`
5. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain:
   - Preview example: `https://your-project-git-branch-your-team.vercel.app`
   - Production example: `https://your-project.vercel.app`
6. In Supabase Auth, add your Vercel URLs to:
   - Site URL
   - Redirect URLs
   - Include `/api/auth/callback`
7. In Stripe, create webhook endpoints for your deployed Vercel URLs:
   - `https://your-project.vercel.app/api/stripe/webhooks`
   - Optionally a preview webhook endpoint if you test against previews
8. Redeploy after env vars are saved.

## Important deployment note

The app imports Stripe server-side and will fail builds if `STRIPE_SECRET_KEY` is missing. On Vercel, make sure Stripe env vars are present before the first production build.

## Core flows shipped

- Email/password and Google OAuth login
- Profile creation and profile quality scoring
- Experience creation with safety preferences and budget expectation
- Real-money offer authorization with Stripe Payment Element
- Manual bid selection and capture flow
- Automatic loser offer release
- Post-selection messaging
- Reporting and moderation queue intake
- Basic cancellation/refund path for selected experiences

## API routes

- `POST /api/experiences`
- `GET|POST /api/experiences/[id]/bids`
- `POST /api/bids/[id]/accept`
- `POST /api/bids/[id]/refund`
- `POST /api/experiences/[id]/cancel`
- `GET|POST /api/messages/[threadId]`
- `GET|PUT /api/profile`
- `POST /api/blocks`
- `POST /api/reports`
- `POST /api/stripe/webhooks`
- `GET /api/auth/callback`

## Edge cases handled

- Poster retains final selection even with tied bid amounts
- Capture failure marks the bid as `capture_failed` so another bidder can be chosen
- A bidder can only keep one live offer per experience
- Winning-match cancellation triggers a Stripe refund during the cancellation window
- Inactive experiences can be closed via `expires_at` logic in the product layer and further automated with a cron job if desired
