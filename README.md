# Lumina AI — Creator Studio

UGC content generation app. Upload a product image + write a prompt → a webhook
(n8n) generates a video + image variations → results stream back to the UI via
Supabase Realtime. Built per [`lumina-ai-spec.md`](./lumina-ai-spec.md).

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind v4** + shadcn-style UI primitives (no Radix dependency)
- **Supabase** — Auth (Google + Email/Password), Postgres, Storage, Realtime
- **Stripe** — Creator Pro subscription ($29/mo)
- **n8n** — video generation webhook (outgoing + callback)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Open http://localhost:3000.

### 1. Environment variables (`.env.local`)

| Var | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (⚠️ server only) |
| `N8N_WEBHOOK_URL` | Your n8n production webhook URL |
| `WEBHOOK_CALLBACK_SECRET` | Any long random string (shared with n8n) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → signing secret |
| `STRIPE_PRICE_ID` | Stripe → Products → Creator Pro recurring price id |
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `http://localhost:3000`) |

### 2. Supabase setup

1. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor. It
   creates the `profiles` + `generations` tables, RLS policies, the
   `handle_new_user` trigger, Realtime publication, and the `products` /
   `outputs` storage buckets + policies.
2. Auth → Providers → enable **Google** and **Email**.
3. Auth → URL config → add `http://localhost:3000/auth/callback` (and your prod
   domain) to the redirect allow-list.

### 3. Stripe setup

1. Create a **Creator Pro** product with a $29/month recurring price → copy the
   price id into `STRIPE_PRICE_ID`.
2. Add a webhook endpoint → `https://<your-domain>/api/webhook/stripe` listening
   for `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.
   - Local testing: `stripe listen --forward-to localhost:3000/api/webhook/stripe`

### 4. n8n webhook (⚠️ confirm the payload format)

The outgoing payload lives in [`lib/webhook.ts`](./lib/webhook.ts)
(`buildWebhookPayload`). It currently uses the **draft** format from spec §7.1:

```jsonc
{
  "generation_id": "<uuid>",
  "user_id": "<uuid>",
  "product_image_url": "https://.../products/xyz.png",
  "prompt": "...",
  "style_preset": "cinematic_studio",
  "aspect_ratio": "9:16",
  "callback_url": "<APP_URL>/api/webhook/callback",
  "callback_secret": "<WEBHOOK_CALLBACK_SECRET>"
}
```

When you wire up your real n8n flow, edit `buildWebhookPayload` to match the
exact field names it expects — but **keep `callback_url` + `callback_secret`**
so n8n can report results back.

n8n must `POST` to `callback_url` when done (spec §7.2):

```jsonc
{
  "generation_id": "<uuid>",
  "status": "completed",
  "video_url": "https://.../final.mp4",
  "image_urls": ["https://.../v1.png", "https://.../v2.png"],
  "metadata": { "model": "Lumina-v4.2-Pro", "creativity": 0.85, "seed": 1834920 }
}
```

Send the secret either as the `X-Callback-Secret` header or a `callback_secret`
body field.

## Routes

| Route | Screen / purpose |
| --- | --- |
| `/login`, `/signup` | Auth (Image 3) |
| `/dashboard` | Create New Content (Image 2) |
| `/my-content`, `/my-content/[id]` | Library + results (Image 1) |
| `/payments` | Upgrade to Creator Pro (Image 4) |
| `/settings` | Profile + subscription |
| `POST /api/generate` | Start a generation + fire webhook |
| `POST /api/webhook/callback` | n8n reports the finished job |
| `POST /api/checkout` | Stripe Checkout session |
| `POST /api/webhook/stripe` | Stripe subscription events |

## Plans (spec §12)

- **Free** — 3 trial credits.
- **Pro** — unlimited generations, commercial rights, 4K exports ($29/mo).

## Build

```bash
npm run build
```
