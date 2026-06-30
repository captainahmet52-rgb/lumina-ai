# Lumina AI — Creator Studio (UGC Content Generation App)

> **Claude Code spec dosyası.** Bu dosyayı projenin köküne `CLAUDE.md` veya `PROJECT.md` olarak koyabilirsin.
> Tasarım referansı: ekran görüntüleri `/design` klasörüne atılacak (4 ekran: login, dashboard, results, payment).

---

## 1. Proje Özeti

Kullanıcı bir **ürün görseli** yükler + bir **prompt** yazar → arka planda webhook tetiklenir → webhook'tan dönen **video URL'si** kullanıcıya sonuç ekranında gösterilir.

**Akış basit:**
1. Kullanıcı giriş yapar (Supabase Auth)
2. Aktif plan/kredi kontrolü yapılır
3. Ürün görseli + prompt + stil + aspect ratio girer
4. `Generate` → Supabase'e `generation` kaydı düşer (status: `pending`) + webhook'a POST atılır
5. Webhook işler, sonucu callback ile geri gönderir → kayıt `completed` olur + `video_url` dolar
6. Supabase Realtime ile frontend anında sonucu gösterir

---

## 2. Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind v4** + **shadcn/ui**
- **Supabase**: Auth (Google + Email/Password), Postgres, Storage, Realtime
- **Webhook**: n8n (video üretimi) → outgoing + callback
- **Payment**: Stripe (USD, US şirketi üzerinden). TR için alternatif: iyzico/PayTR
- Deploy: Coolify / VPS

---

## 3. Tasarım Referansı

Light theme, mor/violet accent. Temiz modern SaaS görünümü. **4 ekran `/design` klasöründeki görsellere birebir uy.**

**Renk paleti:**
```css
--primary: #7c3aed;        /* violet-600, ana buton + accent */
--primary-hover: #6d28d9;
--bg: #f8f9fc;             /* açık gri-mor zemin */
--card: #ffffff;
--text: #1a1a2e;
--muted: #8b8ba7;
--border: #ececf2;
```
Butonlar mor dolu (gradient'e kaçmadan), card'lar yumuşak gölge + radius `rounded-2xl`.

### 3.1 Login (Image 3 — "Welcome back")
- Ortada Lumina AI logo + "Creator Studio"
- "Welcome back" / "Enter your details to access your studio."
- **Login with Google** butonu → `OR EMAIL` ayırıcı
- Email Address, Password (Forgot? linki)
- "Stay logged in for 30 days" checkbox
- **Sign in to Studio** (mor buton)
- Alt: "New to Lumina AI? **Create a free account**"

### 3.2 Dashboard / Create New Content (Image 2)
- Sol sidebar: logo + nav (Dashboard, My Content, Payments, Settings) + altta "Create New AI Content"
- Üst: search bar "Search assets, concepts, or inspiration..."
- Başlık: "Create New Content" + alt açıklama
- **Upload Product** card: drag&drop, "Best results with transparent PNGs", PNG/JPG/WEBP
- **Describe your Vision** card: textarea + "Recent Prompts" + **Style Preset** dropdown (Cinematic Studio) + **Aspect Ratio** (1:1 / 16:9 / 9:16)
- **Generate AI Content** (büyük mor buton)
- Altta "Community Inspiration" galeri grid

### 3.3 Results / My Content (Image 1 — "Creative Vision Unlocked")
- "Generation Complete" badge + büyük başlık + prompt metni
- "Try Again" + "Download All" butonları
- Sol: büyük hero (üretilen ana görsel) | Sağ: 2 varyasyon (Variant A/B)
- Alt row: **Dynamic Motion Asset** (video player card) | **Prompt Metadata** card (Model: Lumina-v4.2-Pro, Creativity: 0.85, Seed: …) | ek görsel
- "Related Variations" grid + "View All History"

### 3.4 Payment (Image 4 — "Complete your upgrade to Creator Pro")
- Sol: **Payment Method** (Cardholder Name, Card Number, Expiry, CVV) + güvenlik notu
- Sağ: **Order Summary** → Creator Pro **$29.00 / Billed monthly**
  - ✓ Unlimited AI Generations
  - ✓ Commercial Usage Rights
  - ✓ 4K High-Res Exports
  - Subtotal $29.00 / Tax (0%) $0.00 / **Total $29.00**
- **Complete Purchase** butonu + "Back to Plans"
- Footer: PCI Compliant, 256-bit SSL

> ⚠️ **PCI notu:** Ham kart numarasını kendi formunda toplama. Görseldeki kart formu **tasarım** olarak kalsın ama gerçek işlem **Stripe Checkout / Stripe Elements** ile yapılsın. Kart verisi senin sunucuna hiç değmesin.

---

## 4. Routes

```
/login                → Image 3
/signup               → Image 3 varyantı
/dashboard            → Image 2 (Create New Content) [auth gerekli]
/my-content           → liste + /my-content/[id] = Image 1 results
/payments             → Image 4 (upgrade)
/settings             → profil/plan
/api/generate         → POST: generation başlat + webhook tetikle
/api/webhook/callback → POST: webhook'tan sonucu al
/api/checkout         → POST: Stripe checkout session
/api/webhook/stripe   → POST: Stripe events
```

---

## 5. Supabase Şeması

```sql
-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free',                 -- 'free' | 'pro'
  credits int default 3,                     -- free kullanıcı için
  subscription_status text default 'inactive',
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- GENERATIONS
create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  product_image_url text not null,
  prompt text not null,
  style_preset text default 'cinematic_studio',
  aspect_ratio text default '1:1',           -- '1:1' | '16:9' | '9:16'
  status text default 'pending',             -- pending | processing | completed | failed
  video_url text,
  image_urls jsonb,                          -- varyasyon görselleri []
  metadata jsonb,                            -- { model, creativity, seed }
  error text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS
alter table profiles enable row level security;
alter table generations enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id);

create policy "own generations select" on generations
  for select using (auth.uid() = user_id);
create policy "own generations insert" on generations
  for insert with check (auth.uid() = user_id);

-- Yeni kullanıcı → profile otomatik
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Storage buckets:**
- `products` (public read) → kullanıcı ürün görselleri
- `outputs` (opsiyonel) → webhook çıktıları burada saklanacaksa

**Realtime:** `generations` tablosunda replication açık olsun (status update'i frontend dinleyecek).

---

## 6. Generation Akışı (detay)

### 6.1 `POST /api/generate`
1. Auth kontrolü (Supabase server client)
2. Plan/kredi kontrolü:
   - `plan = 'pro'` → sınırsız
   - `plan = 'free'` → `credits > 0` ise devam, değilse 402 + "Upgrade to Pro" yönlendir
3. Body: `{ product_image_url, prompt, style_preset, aspect_ratio }`
4. `generations` tablosuna `status: 'pending'` kayıt insert et → `generation_id` al
5. Webhook'a POST at (bkz. Bölüm 7)
6. Free kullanıcıysa `credits--`
7. `{ generation_id }` döndür → frontend `/my-content/[id]` sayfasına geçip Realtime dinlemeye başlar

### 6.2 Realtime / Sonuç
- Frontend `/my-content/[id]` sayfasında `generations` satırını `id` ile subscribe eder
- `status: 'completed'` + `video_url` dolduğunda → Image 1 sonucu render edilir
- `status: 'failed'` → hata mesajı + "Try Again"
- Bekleme sırasında: loading state (skeleton + "Lumina is generating your vision...")

---

## 7. Webhook Entegrasyonu

### 7.1 Giden istek (App → Webhook / n8n)

`N8N_WEBHOOK_URL` adresine POST.

```
⚠️ INPUT FORMATI — BURAYI SONRA KENDİN DOLDURACAKSIN
───────────────────────────────────────────────────
Aşağıdaki taslak default. Kendi webhook'unun beklediği
gerçek alan adlarını/yapısını buraya yapıştır:

POST {N8N_WEBHOOK_URL}
Content-Type: application/json

{
  "generation_id": "<uuid>",
  "user_id": "<uuid>",
  "product_image_url": "https://.../products/xyz.png",
  "prompt": "A futuristic perfume bottle on a floating glass platform...",
  "style_preset": "cinematic_studio",
  "aspect_ratio": "9:16",
  "callback_url": "{NEXT_PUBLIC_APP_URL}/api/webhook/callback",
  "callback_secret": "{WEBHOOK_CALLBACK_SECRET}"
}
───────────────────────────────────────────────────
```

> `callback_url` + `callback_secret`'i mutlaka payload'a koy ki n8n iş bitince geri dönebilsin.

### 7.2 Dönen istek (Webhook → App)

`POST /api/webhook/callback`
- Header veya body'deki `callback_secret`'i doğrula (yetkisizse 401)
- Body örneği:

```json
{
  "generation_id": "<uuid>",
  "status": "completed",
  "video_url": "https://.../output/final.mp4",
  "image_urls": ["https://.../v1.png", "https://.../v2.png"],
  "metadata": { "model": "Lumina-v4.2-Pro", "creativity": 0.85, "seed": 1834920 }
}
```
- İlgili `generations` satırını **service role key** ile update et (`status`, `video_url`, `image_urls`, `metadata`, `completed_at`)
- Realtime otomatik frontend'i tetikler

---

## 8. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Webhook
N8N_WEBHOOK_URL=
WEBHOOK_CALLBACK_SECRET=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=            # Creator Pro $29/mo price id

# App
NEXT_PUBLIC_APP_URL=
```

---

## 9. Payment (Stripe)

1. `/payments` (Image 4) → "Complete Purchase" → `POST /api/checkout`
2. Stripe Checkout Session oluştur (`STRIPE_PRICE_ID`, mode: `subscription`) → kullanıcıyı Stripe'a yönlendir
3. `POST /api/webhook/stripe` → `checkout.session.completed` / `customer.subscription.updated` event'lerinde `profiles.plan = 'pro'`, `subscription_status = 'active'` yap
4. `customer.subscription.deleted` → `plan = 'free'`

> Görseldeki kart formu UI olarak kalabilir ama submit → Stripe Checkout'a redirect etsin (ham kart verisi toplanmaz).

---

## 10. Klasör Yapısı

```
app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (app)/dashboard/page.tsx
  (app)/my-content/page.tsx
  (app)/my-content/[id]/page.tsx
  (app)/payments/page.tsx
  (app)/settings/page.tsx
  api/generate/route.ts
  api/webhook/callback/route.ts
  api/checkout/route.ts
  api/webhook/stripe/route.ts
components/
  sidebar.tsx
  upload-product.tsx
  prompt-form.tsx
  generation-result.tsx
  generation-skeleton.tsx
  ui/...                  # shadcn
lib/
  supabase/server.ts
  supabase/client.ts
  stripe.ts
  webhook.ts
design/                   # 4 ekran görseli buraya
```

---

## 11. Build Sırası (Claude Code fazları)

1. **Setup** → Next.js 15 + Tailwind v4 + shadcn + Supabase client/server + env
2. **Auth** → Login/Signup (Image 3), Google OAuth + email/password, middleware ile route koruma
3. **Layout** → sidebar + app shell (Image 1/2'deki nav)
4. **Create Content** → Image 2: upload (Supabase Storage'a) + prompt form + style/aspect
5. **Generate API** → `/api/generate` + kredi kontrolü + webhook out
6. **Callback + Realtime + Results** → `/api/webhook/callback` + `/my-content/[id]` (Image 1) + loading state
7. **Payment** → Image 4 + Stripe checkout + plan gating
8. **My Content liste + Settings**

---

## 12. Notlar

- Free plan: 3 kredi (deneme). Pro: sınırsız.
- Video gelene kadar UI **bekleme/loading** state'inde kalmalı (polling değil, Realtime).
- `Try Again` → aynı input ile yeni generation tetikler.
- `Download All` → video + görselleri indir.
- Tüm secret'lar server-side; `service_role_key` asla client'a sızmasın.
- **Webhook input formatını Bölüm 7.1'e yapıştırmayı unutma** — şu an taslak.
