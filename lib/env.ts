/**
 * Centralised env access. We validate lazily (per-getter) so that the build
 * does not crash when an optional integration (e.g. Stripe) is not configured
 * yet, but server routes still fail fast with a clear message when used.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  // Supabase (public)
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  // Supabase (server only)
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },

  // Webhook (n8n)
  get n8nWebhookUrl() {
    return optional("N8N_WEBHOOK_URL");
  },
  get webhookCallbackSecret() {
    return required("WEBHOOK_CALLBACK_SECRET");
  },

  // Stripe
  get stripePublishableKey() {
    return optional("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  },
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY");
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET");
  },
  get stripePriceId() {
    return required("STRIPE_PRICE_ID");
  },

  // App
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
};
