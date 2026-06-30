import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/** Lazily-initialised Stripe server client (server only). */
export function getStripe(): Stripe {
  if (!_stripe) {
    // apiVersion intentionally omitted — the SDK pins the version it ships
    // with, which keeps the typings in sync across upgrades.
    _stripe = new Stripe(env.stripeSecretKey, {
      typescript: true,
      appInfo: { name: "Lumina AI — Creator Studio" },
    });
  }
  return _stripe;
}
