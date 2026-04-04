---
name: stripe-integration
description: >
  Stripe subscription integration with trial management using Stripe Elements.
  Covers the complete flow: customer creation, trial subscriptions with
  SetupIntent, embedded card collection via PaymentElement, webhook handling,
  customer portal, canceled subscription reactivation, and trial abuse prevention.
  Use when working with payments, subscriptions, trials, or billing.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm *), Bash(npx *)
---

# Stripe Integration

This skill documents the full Stripe integration pattern for subscription-based apps with free trials, using **Stripe Elements** (embedded, no redirect) instead of Stripe Checkout.

## Architecture

```
User registers → account + Stripe customer created
               ↓
User goes to /setup-payment
               ↓
Backend creates subscription with trial + SetupIntent (status: incomplete)
               ↓
Frontend receives clientSecret → renders <PaymentElement>
               ↓
User enters CC → stripe.confirmSetup() → SetupIntent succeeds
               ↓
Stripe webhook fires → subscription status: trialing
Frontend calls /api/stripe/sync → DB updated immediately
               ↓
User redirected to /dashboard (tier: premium, status: trialing)
               ↓
After 7 days → Stripe auto-charges → webhook → status: active
               ↓
If user cancels → webhook → status: canceled → tier: free
               ↓
Canceled user logs in → redirected back to /setup-payment
  → sees "Reactivar Suscripción" message → no new trial (abuse prevention)
```

## Required Environment Variables

```env
# Client-side (embedded in build, NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Server-side only
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Needed for building the return URL
NEXT_PUBLIC_APP_URL="https://your-app.com"
```

**IMPORTANT**: `NEXT_PUBLIC_*` variables are embedded at **build time**. If you change them, rebuild the Docker image with `--no-cache`.

## Stripe Dashboard Setup

Before the app will work, configure these in [Stripe Dashboard](https://dashboard.stripe.com):

### 1. API Keys
**Developers → API Keys** → copy `pk_test_...` and `sk_test_...`

### 2. Product + Price
**Product Catalog → + Add product**:
- Name: e.g. "Premium Subscription"
- Price: e.g. $19.99/month recurring
- Copy the Price ID (`price_...`)

### 3. Webhook
**Developers → Webhooks → + Add endpoint**:
- URL: `https://your-app.com/api/stripe/webhook`
- Events:
  - `customer.subscription.updated` — status changes (incomplete → trialing → active → canceled → past_due)
  - `customer.subscription.deleted` — subscription fully removed
  - `invoice.payment_failed` — card declined at end of trial or recurring charge
- Copy the signing secret (`whsec_...`)

### 4. Customer Portal
**Settings → Billing → Customer portal** → enable:
- Update payment method
- Cancel subscription
- View invoices

### 5. Trial Abuse Prevention (optional but recommended)
**Settings → Billing → Subscriptions → Trial configuration** → enable **"Block trials for returning customers"** to prevent users from creating multiple accounts to get repeated trials.

## File Structure

```
src/
├── lib/
│   └── stripe.ts                      # Stripe client + helpers
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── register/route.ts      # Creates user + Stripe customer
│   │   └── stripe/
│   │       ├── subscribe/route.ts     # Create subscription + return clientSecret
│   │       ├── sync/route.ts          # Sync DB from Stripe (avoid webhook race)
│   │       ├── portal/route.ts        # Create Customer Portal session
│   │       └── webhook/route.ts       # Handle subscription lifecycle events
│   └── (public)/
│       ├── register/page.tsx          # Step 1: account creation
│       └── setup-payment/page.tsx     # Step 2: embedded Elements CC form
```

## Prisma Schema

Add these fields to the `User` model:

```prisma
model User {
  // ... other fields

  // Stripe integration
  stripeCustomerId     String?   @unique  // cus_...
  stripeSubscriptionId String?            // sub_...
  stripeStatus         String?            // "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "incomplete_expired"
  trialEndsAt          DateTime?          // Informational; Stripe is source of truth
}
```

**Do NOT** store card details (`cardLast4`, `cardBrand`, etc.) — Stripe handles all PCI data.

## Key Implementation Patterns

### 1. Stripe client (`src/lib/stripe.ts`)

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;
export const TRIAL_DAYS = 7;

export async function createStripeCustomer(email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { source: "your-app-name" },
  });
  return customer.id;
}

export async function createTrialSubscription(
  customerId: string,
  options: { withTrial?: boolean } = { withTrial: true },
): Promise<{ subscriptionId: string; clientSecret: string }> {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: STRIPE_PRICE_ID }],
    ...(options.withTrial ? { trial_period_days: TRIAL_DAYS } : {}),
    payment_settings: {
      save_default_payment_method: "on_subscription",
      payment_method_types: ["card"],  // Force card-only
    },
    // CRITICAL: payment_behavior + trial creates a pending SetupIntent
    // instead of charging immediately. This is what lets us use Elements
    // to collect the CC without a redirect.
    payment_behavior: "default_incomplete",
    expand: ["pending_setup_intent"],
  });

  const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;
  if (!setupIntent?.client_secret) {
    throw new Error("No setup intent returned from subscription creation");
  }

  return {
    subscriptionId: subscription.id,
    clientSecret: setupIntent.client_secret,
  };
}
```

### 2. Subscribe endpoint — handle all edge cases

The `/api/stripe/subscribe` route must handle:
- **First-time user** → create customer + subscription with trial
- **User with pending SetupIntent** (started but didn't finish CC) → return existing clientSecret
- **User with active subscription** → block with error (they should use portal)
- **User with canceled subscription** → create NEW subscription WITHOUT trial (abuse prevention) + return `isReactivation: true`
- **Subscription deleted in Stripe** → clear DB and create new
- **Previously canceled customer** (webhook cleared `stripeSubscriptionId`) → detect via Stripe API query for canceled subs

**IMPORTANT — detecting reactivation**: The webhook for `customer.subscription.deleted` typically clears `stripeSubscriptionId`. This means when a canceled user returns, you can't tell from the DB alone whether they're new or returning. **Query Stripe directly**:

```typescript
// If DB has customer but no sub, check if there are any canceled subs in Stripe
if (dbUser.stripeCustomerId && !dbUser.stripeSubscriptionId) {
  const pastSubs = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
    status: "canceled",
    limit: 1,
  });
  hadCanceledSubscription = pastSubs.data.length > 0;
}
```

Return an `isReactivation` flag in the response so the frontend can show a different UI ("Reactivar Suscripción" vs "Comenzar Prueba Gratuita"). **Do not rely on `user.stripeStatus === "canceled"` from the auth context** — that field can get stale (the subscribe endpoint updates it to "incomplete" when creating the new subscription).

```typescript
export const POST = apiHandler("auth", async ({ user }) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { email: true, name: true, stripeCustomerId: true, stripeSubscriptionId: true, stripeStatus: true },
  });

  if (!dbUser) return error("Usuario no encontrado", 404);

  let hadCanceledSubscription = false;

  // Path 1: Webhook already cleared stripeSubscriptionId — check Stripe for past subs
  if (dbUser.stripeCustomerId && !dbUser.stripeSubscriptionId) {
    const pastSubs = await stripe.subscriptions.list({
      customer: dbUser.stripeCustomerId,
      status: "canceled",
      limit: 1,
    });
    if (pastSubs.data.length > 0) {
      hadCanceledSubscription = true;
    }
  }

  // Path 2: Subscription ID still in DB — check its current state
  if (dbUser.stripeSubscriptionId) {
    try {
      const existing = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId, {
        expand: ["pending_setup_intent"],
      });

      if (["canceled", "incomplete_expired"].includes(existing.status)) {
        hadCanceledSubscription = true;
        await prisma.user.update({
          where: { id: user.userId },
          data: { stripeSubscriptionId: null, stripeStatus: existing.status },
        });
      } else {
        const setupIntent = existing.pending_setup_intent as Stripe.SetupIntent | null;
        if (setupIntent?.client_secret && setupIntent.status !== "succeeded") {
          return json({
            clientSecret: setupIntent.client_secret,
            subscriptionId: existing.id,
            isReactivation: hadCanceledSubscription,
          });
        }
        return error("Ya tenés una suscripción activa.", 400);
      }
    } catch {
      await prisma.user.update({
        where: { id: user.userId },
        data: { stripeSubscriptionId: null, stripeStatus: null },
      });
    }
  }

  let customerId = dbUser.stripeCustomerId;
  if (!customerId) {
    customerId = await createStripeCustomer(dbUser.email, dbUser.name);
    await prisma.user.update({
      where: { id: user.userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const { subscriptionId, clientSecret } = await createTrialSubscription(customerId, {
    withTrial: !hadCanceledSubscription,  // No trial for returning customers
  });

  await prisma.user.update({
    where: { id: user.userId },
    data: { stripeSubscriptionId: subscriptionId, stripeStatus: "incomplete" },
  });

  return json({ clientSecret, subscriptionId, isReactivation: hadCanceledSubscription });
});
```

### 3. Sync endpoint — avoid webhook race conditions

**Problem**: After `confirmSetup()`, the frontend refreshes user data but the webhook may not have fired yet, leaving `stripeStatus: "incomplete"` in DB → redirect loop.

**Solution**: Call `/api/stripe/sync` right after `confirmSetup` succeeds to fetch the real status from Stripe and update the DB directly.

```typescript
// src/app/api/stripe/sync/route.ts
export const POST = apiHandler("auth", async ({ user }) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { stripeSubscriptionId: true },
  });

  if (!dbUser?.stripeSubscriptionId) return error("No tenés una suscripción", 400);

  const subscription = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId);
  const isActive = ["trialing", "active"].includes(subscription.status);

  await prisma.user.update({
    where: { id: user.userId },
    data: {
      stripeStatus: subscription.status,
      tier: isActive ? "premium" : "free",
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  return json({ status: subscription.status });
});
```

### 4. Webhook handler

```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeStatus: subscription.status,
            tier: ["active", "trialing"].includes(subscription.status) ? "premium" : "free",
            trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: { stripeSubscriptionId: null, stripeStatus: "canceled", tier: "free" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[Stripe] Payment failed for customer ${invoice.customer}`);
        // Stripe retries automatically; subscription.updated handles tier change
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe] Webhook handler failed:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

**CRITICAL**: The webhook reads the raw body for signature verification. In Next.js App Router, use `req.text()` — do NOT parse as JSON first.

### 5. Frontend Elements integration

```typescript
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Auto-load subscription on mount
const subscribeCalled = useRef(false);
useEffect(() => {
  if (!loading && isAuthenticated && needsPaymentSetup && !clientSecret && !subscribeCalled.current) {
    subscribeCalled.current = true;
    fetch("/api/stripe/subscribe", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else updateUser().then(() => router.push("/dashboard"));
      });
  }
}, [loading, isAuthenticated, needsPaymentSetup, clientSecret]);

// Render Elements
<Elements
  stripe={stripePromise}
  options={{
    clientSecret,
    appearance: { theme: "stripe", variables: { colorPrimary: "#6B46C1" } },
  }}
>
  <PaymentForm />
</Elements>

// PaymentForm handles confirmSetup
function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard` },
      redirect: "if_required",  // Only redirect for 3DS/bank flows
    });

    if (error) { /* show error */ return; }

    // IMPORTANT: sync directly to avoid webhook race
    await fetch("/api/stripe/sync", { method: "POST" });
    await updateUser();
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit">Confirmar</button>
    </form>
  );
}
```

### 6. Access control (app layout guard)

Block access to the app until payment is set up:

```typescript
// In AuthContext
const needsPaymentSetup = !!user
  && user.role !== "admin"
  && !["trialing", "active"].includes(user.stripeStatus || "");

// In app layout
useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push("/login");
  } else if (!loading && isAuthenticated && needsPaymentSetup) {
    router.push("/setup-payment");
  }
}, [loading, isAuthenticated, needsPaymentSetup, router]);

if (!isAuthenticated || needsPaymentSetup) return null;
```

Admins are exempt from the payment requirement.

## Common Pitfalls

### 1. `NEXT_PUBLIC_*` env vars not updating
These are embedded at **build time**. After changing them, you MUST rebuild:
```bash
docker compose -f docker-compose.server.yml build --no-cache app
```

### 2. Webhook signature verification fails
Use `req.text()` to get the raw body, NOT `req.json()`. Stripe needs the exact bytes sent.

### 3. Race condition between confirmSetup and webhook
After `confirmSetup()` succeeds, the subscription status in your DB may still be "incomplete" because the webhook hasn't fired yet. Always call `/api/stripe/sync` right after to fetch the real state from Stripe.

### 4. Double-calling subscribe on page mount
`useEffect` can fire twice in React Strict Mode. Use a `useRef` guard:
```typescript
const called = useRef(false);
useEffect(() => {
  if (!called.current) { called.current = true; /* fetch */ }
}, []);
```

### 5. Trial abuse
Without guards, a user can:
- Cancel their subscription and re-subscribe to get another trial
- Create multiple accounts with the same card

**Mitigations**:
- In code: track `hadCanceledSubscription` and skip `trial_period_days` when creating a new subscription for returning users
- In Stripe Dashboard: enable "Block trials for returning customers"

### 6. Prisma client out of sync after schema changes
After changing `schema.prisma`, run `npx prisma generate` before building.

### 7. Migration refuses to drop columns with data
`prisma db push` refuses to drop columns that contain data. Add `--accept-data-loss`:
```bash
npx prisma db push --skip-generate --accept-data-loss
```

### 8. `paymentMethodTypes` not valid on Elements options
It's NOT a valid option on the client-side `<Elements>` provider. Restrict payment methods on the **server** via `payment_settings.payment_method_types` when creating the subscription.

### 9. Detecting "returning customer" (for reactivation UI)
When a user's subscription is canceled, the webhook handler for `customer.subscription.deleted` typically clears `stripeSubscriptionId`. This leaves the DB in a state indistinguishable from a brand-new user (no sub, no status). **Don't rely on `user.stripeStatus === "canceled"`** — the subscribe endpoint overwrites it to "incomplete" when creating a new sub.

**Correct approach**: In the subscribe endpoint, query Stripe for past canceled subscriptions on the customer, and return an `isReactivation` flag in the response. The frontend uses this flag to show a different UI ("Reactivar Suscripción" vs "Comenzar Prueba Gratuita"):

```typescript
// Server
if (dbUser.stripeCustomerId && !dbUser.stripeSubscriptionId) {
  const pastSubs = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
    status: "canceled",
    limit: 1,
  });
  hadCanceledSubscription = pastSubs.data.length > 0;
}
// ...
return json({ clientSecret, subscriptionId, isReactivation: hadCanceledSubscription });

// Frontend
const [isReactivation, setIsReactivation] = useState(false);
// After fetch:
setIsReactivation(!!data.isReactivation);
// UI:
{isReactivation ? "Reactivar Suscripción" : "Tarjeta de Crédito"}
```

## Testing

### Test cards
- `4242 4242 4242 4242` — success
- `4000 0000 0000 0002` — declined
- `4000 0000 0000 9995` — insufficient funds
- `4000 0025 0000 3155` — requires 3DS authentication
- Any future date for expiry, any CVC

### Force end of trial (for testing)

**Option 1: Stripe Dashboard** (easiest)
1. Customers → find customer → click subscription
2. Actions → "End trial now"

**Option 2: Stripe CLI**
```bash
stripe trials end sub_xxx
```

**Option 3: Test Clocks** (most realistic)
1. Dashboard → Test Clocks → Create
2. Create customer + subscription attached to the test clock
3. Advance the clock by 7 days

### Local webhook testing
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
The CLI prints a temporary `whsec_...` to use as `STRIPE_WEBHOOK_SECRET` during local dev.

## Subscription Status Reference

| Status | Meaning | User access |
|--------|---------|-------------|
| `incomplete` | SetupIntent not yet confirmed | Blocked → setup-payment |
| `incomplete_expired` | SetupIntent expired without confirmation | Blocked → setup-payment |
| `trialing` | In free trial period | Full access |
| `active` | Paying customer | Full access |
| `past_due` | Payment failed, Stripe is retrying | Blocked → setup-payment (or grace period) |
| `canceled` | Subscription ended | Blocked → setup-payment (reactivation) |
| `unpaid` | All payment retries failed | Blocked → setup-payment |

## Webhook Events Reference

| Event | When it fires | What to do |
|-------|---------------|------------|
| `customer.subscription.updated` | Any status change, trial end, plan change | Update `stripeStatus` and `tier` |
| `customer.subscription.deleted` | Subscription fully canceled | Clear `stripeSubscriptionId`, set `tier: free` |
| `invoice.payment_failed` | Card declined at trial end or renewal | Log; `subscription.updated` will follow |
| `invoice.paid` | Successful renewal charge | Optional: log for accounting |

## Summary of flow

1. **Register** → `/api/auth/register` creates user + Stripe customer
2. **Redirect to `/setup-payment`** → auto-fetches `/api/stripe/subscribe` → renders `<PaymentElement>`
3. **User enters CC** → `stripe.confirmSetup()` → SetupIntent succeeds
4. **Sync + refresh** → `/api/stripe/sync` updates DB → `updateUser()` → redirect to dashboard
5. **Webhook fires (async)** → updates DB redundantly (sync already did it)
6. **Trial ends (7 days later)** → Stripe charges card → webhook → status: `active`
7. **User cancels** (via portal) → webhook → status: `canceled` → tier: `free`
8. **Canceled user logs in** → redirected to `/setup-payment` → "Reactivar Suscripción" → new subscription WITHOUT trial
