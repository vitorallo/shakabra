# Stripe Integration Guide for SaaS Applications

## Overview
This documentation covers Stripe integration patterns for Next.js applications, including subscriptions, payments, webhooks, and best practices for the Shakabra AI DJ Party Player SaaS model.

## Installation

```bash
npm install stripe @stripe/stripe-js
```

## Environment Variables

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Stripe Configuration

### Server-Side Stripe Client

```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})
```

### Client-Side Stripe

```typescript
// lib/stripe-client.ts
import { loadStripe } from '@stripe/stripe-js'

let stripePromise: Promise<stripe.Stripe | null>

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export default getStripe
```

## Subscription Management

### Create Products and Prices

```typescript
// lib/stripe-setup.ts
import { stripe } from '@/lib/stripe'

export async function createProducts() {
  // Create Free Product (for reference)
  const freeProduct = await stripe.products.create({
    name: 'Shakabra Free',
    description: 'Basic DJ mixing with limited features',
    metadata: {
      tier: 'free'
    }
  })

  // Create Pro Product
  const proProduct = await stripe.products.create({
    name: 'Shakabra Pro',
    description: 'Professional DJ mixing with unlimited features',
    metadata: {
      tier: 'pro'
    }
  })

  // Create Pro Price (Monthly)
  const proMonthlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 999, // $9.99 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      tier: 'pro',
      billing: 'monthly'
    }
  })

  // Create Pro Price (Annual)
  const proAnnualPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 9999, // $99.99 in cents (2 months free)
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    metadata: {
      tier: 'pro',
      billing: 'annual'
    }
  })

  return {
    products: { free: freeProduct, pro: proProduct },
    prices: { proMonthly: proMonthlyPrice, proAnnual: proAnnualPrice }
  }
}
```

### Checkout Session Creation

```typescript
// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, trialDays = 7 } = await request.json()

    // Check if customer already exists
    let customer
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        }
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          supabase_user_id: user.id,
        }
      },
      metadata: {
        supabase_user_id: user.id,
      }
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Checkout Component

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import getStripe from '@/lib/stripe-client'

interface CheckoutButtonProps {
  priceId: string
  tier: string
  price: string
  interval: string
}

export function CheckoutButton({ priceId, tier, price, interval }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          trialDays: 7
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      
      const stripe = await getStripe()
      const { error } = await stripe!.redirectToCheckout({ sessionId })

      if (error) {
        console.error('Stripe error:', error)
        // Handle error (show toast, etc.)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : `Subscribe to ${tier} - ${price}/${interval}`}
    </button>
  )
}
```

### Pricing Page Component

```typescript
// components/PricingPlans.tsx
import { CheckoutButton } from './CheckoutButton'

const PRICING_PLANS = [
  {
    tier: 'Free',
    price: '$0',
    interval: 'month',
    description: 'Perfect for getting started',
    features: [
      'Up to 3 playlists',
      'Basic AI mixing',
      '3-second crossfade',
      '1 hour session limit'
    ],
    priceId: null,
    popular: false
  },
  {
    tier: 'Pro',
    price: '$9.99',
    interval: 'month',
    description: 'Unlimited DJ power',
    features: [
      'Unlimited playlists',
      'Advanced AI mixing',
      'Up to 30-second crossfade',
      'Unlimited session length',
      'Mix recording & export',
      'Priority support'
    ],
    priceId: 'price_1234567890', // Replace with actual price ID
    popular: true
  }
]

export function PricingPlans() {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Start with a free trial, upgrade anytime
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-lg shadow-lg divide-y divide-gray-200 ${
                plan.popular
                  ? 'border-2 border-purple-500 transform scale-105'
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="bg-purple-500 text-white text-center py-2 text-sm font-medium rounded-t-lg">
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.tier}</h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{plan.interval}
                  </span>
                </p>
              </div>

              <div className="pt-6 pb-8 px-6">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  {plan.priceId ? (
                    <CheckoutButton
                      priceId={plan.priceId}
                      tier={plan.tier}
                      price={plan.price}
                      interval={plan.interval}
                    />
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-500 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Webhook Handling

### Webhook Endpoint

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase)
        break
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object, supabase)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase)
        break
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error processing webhook: ${event.type}`, error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription created:', subscription.id)
  
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: subscription.metadata.supabase_user_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    })

  if (error) {
    console.error('Error creating subscription record:', error)
    throw error
  }

  // Update user profile
  await supabase
    .from('profiles')
    .update({ 
      subscription_tier: getSubscriptionTier(subscription.items.data[0].price.id),
      subscription_status: subscription.status
    })
    .eq('id', subscription.metadata.supabase_user_id)
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription updated:', subscription.id)
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription record:', error)
    throw error
  }

  // Update user profile
  await supabase
    .from('profiles')
    .update({ 
      subscription_tier: getSubscriptionTier(subscription.items.data[0].price.id),
      subscription_status: subscription.status
    })
    .eq('id', subscription.metadata.supabase_user_id)
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription deleted:', subscription.id)
  
  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Downgrade user to free tier
  await supabase
    .from('profiles')
    .update({ 
      subscription_tier: 'free',
      subscription_status: 'canceled'
    })
    .eq('id', subscription.metadata.supabase_user_id)
}

async function handleTrialWillEnd(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Trial will end:', subscription.id)
  
  // Send notification email to user
  // You could integrate with email service here
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', subscription.metadata.supabase_user_id)
    .single()

  if (profile) {
    // Send trial ending notification
    console.log(`Send trial ending email to ${profile.email}`)
  }
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Payment succeeded:', invoice.id)
  
  // Record successful payment
  await supabase
    .from('payments')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      paid_at: new Date(invoice.status_transitions.paid_at! * 1000)
    })
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Payment failed:', invoice.id)
  
  // Record failed payment
  await supabase
    .from('payments')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      created_at: new Date()
    })

  // You might want to send payment failed notification
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log('Checkout completed:', session.id)
  
  // Update user onboarding status or trigger welcome email
  if (session.metadata?.supabase_user_id) {
    await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        stripe_customer_id: session.customer
      })
      .eq('id', session.metadata.supabase_user_id)
  }
}

function getSubscriptionTier(priceId: string): string {
  // Map price IDs to subscription tiers
  const tierMapping: Record<string, string> = {
    'price_1234567890': 'pro', // Monthly Pro
    'price_0987654321': 'pro', // Annual Pro
  }
  
  return tierMapping[priceId] || 'free'
}
```

## Customer Portal Integration

### Create Portal Session

```typescript
// app/api/create-portal-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/dashboard/subscription`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Portal Button Component

```typescript
'use client'

import { useState } from 'react'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Portal error:', error)
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleManageSubscription}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Manage Subscription'}
    </button>
  )
}
```

## Database Schema for Subscriptions

```sql
-- Add subscription fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL,
  price_id text NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own payments" ON public.payments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE stripe_customer_id = payments.stripe_customer_id
    )
  );
```

## Subscription Status Component

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ManageSubscriptionButton } from './ManageSubscriptionButton'

interface Subscription {
  status: string
  price_id: string
  cancel_at_period_end: boolean
  current_period_end: string
  trial_end: string | null
}

export function SubscriptionStatus({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error)
      } else {
        setSubscription(data)
      }
      setLoading(false)
    }

    fetchSubscription()
  }, [userId])

  if (loading) {
    return <div>Loading subscription status...</div>
  }

  if (!subscription) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium">Free Plan</h3>
        <p className="text-gray-600 mt-2">
          You're currently on the free plan with limited features.
        </p>
        <div className="mt-4">
          <a
            href="/pricing"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    )
  }

  const isTrialing = subscription.trial_end && new Date(subscription.trial_end) > new Date()
  const trialDaysLeft = isTrialing 
    ? Math.ceil((new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="bg-purple-50 rounded-lg p-6">
      <h3 className="text-lg font-medium">Pro Plan</h3>
      
      {isTrialing ? (
        <p className="text-gray-600 mt-2">
          You're on a free trial with {trialDaysLeft} days remaining.
        </p>
      ) : (
        <p className="text-gray-600 mt-2">
          {subscription.cancel_at_period_end 
            ? `Your subscription will cancel on ${new Date(subscription.current_period_end).toLocaleDateString()}`
            : `Next billing date: ${new Date(subscription.current_period_end).toLocaleDateString()}`
          }
        </p>
      )}

      <div className="mt-4">
        <ManageSubscriptionButton />
      </div>
    </div>
  )
}
```

## Feature Gating

### Subscription Hook

```typescript
// hooks/useSubscription.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface UserSubscription {
  tier: 'free' | 'pro'
  status: string | null
  isActive: boolean
  isTrialing: boolean
  trialEndsAt: Date | null
}

export function useSubscription(userId: string) {
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: 'free',
    status: null,
    isActive: false,
    isTrialing: false,
    trialEndsAt: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserSubscription() {
      const supabase = createClient()
      
      // Get user profile with subscription info
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status')
        .eq('id', userId)
        .single()

      // Get active subscription details
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('status, trial_end')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'past_due'])
        .single()

      const isTrialing = subData?.trial_end && new Date(subData.trial_end) > new Date()
      const isActive = subData?.status === 'active' || subData?.status === 'trialing'

      setSubscription({
        tier: (profile?.subscription_tier as 'free' | 'pro') || 'free',
        status: subData?.status || null,
        isActive,
        isTrialing: Boolean(isTrialing),
        trialEndsAt: subData?.trial_end ? new Date(subData.trial_end) : null
      })
      setLoading(false)
    }

    fetchUserSubscription()
  }, [userId])

  return {
    subscription,
    loading,
    isPro: subscription.tier === 'pro' && subscription.isActive,
    isFree: subscription.tier === 'free' || !subscription.isActive
  }
}
```

### Feature Gate Component

```typescript
// components/FeatureGate.tsx
'use client'

import { ReactNode } from 'react'
import { useSubscription } from '@/hooks/useSubscription'

interface FeatureGateProps {
  feature: 'unlimited_playlists' | 'advanced_mixing' | 'export_mixes' | 'extended_crossfade'
  userId: string
  children: ReactNode
  fallback?: ReactNode
}

const FEATURE_REQUIREMENTS: Record<string, 'pro'> = {
  unlimited_playlists: 'pro',
  advanced_mixing: 'pro',
  export_mixes: 'pro',
  extended_crossfade: 'pro'
}

export function FeatureGate({ feature, userId, children, fallback }: FeatureGateProps) {
  const { subscription, isPro } = useSubscription(userId)
  
  const requiredTier = FEATURE_REQUIREMENTS[feature]
  const hasAccess = requiredTier === 'pro' ? isPro : true

  if (!hasAccess) {
    return (
      <div className="relative">
        {fallback || (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">Pro Feature</h3>
            <p className="text-gray-600 mt-2">
              This feature requires a Pro subscription.
            </p>
            <a
              href="/pricing"
              className="inline-block mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Upgrade to Pro
            </a>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}
```

### Usage Limits

```typescript
// lib/limits.ts
export const SUBSCRIPTION_LIMITS = {
  free: {
    maxPlaylists: 3,
    maxSessionDuration: 3600, // 1 hour in seconds
    crossfadeDuration: 3, // seconds
    canExportMixes: false,
    supportPriority: 'standard'
  },
  pro: {
    maxPlaylists: Infinity,
    maxSessionDuration: Infinity,
    crossfadeDuration: 30, // seconds
    canExportMixes: true,
    supportPriority: 'priority'
  }
}

export function getUserLimits(tier: 'free' | 'pro') {
  return SUBSCRIPTION_LIMITS[tier]
}

// Usage checking function
export async function checkUsageLimit(
  userId: string, 
  limitType: keyof typeof SUBSCRIPTION_LIMITS.free
) {
  const supabase = createClient()
  
  // Get user's subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', userId)
    .single()

  const tier = profile?.subscription_tier as 'free' | 'pro'
  const limits = getUserLimits(tier || 'free')

  // Check specific limits
  switch (limitType) {
    case 'maxPlaylists':
      const { count } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      return {
        current: count || 0,
        limit: limits.maxPlaylists,
        exceeded: count >= limits.maxPlaylists
      }

    default:
      return { current: 0, limit: Infinity, exceeded: false }
  }
}
```

## Summary

This Stripe integration guide provides:

1. **Complete Subscription Setup**: Products, prices, and checkout flow
2. **Secure Webhook Handling**: Real-time subscription status updates
3. **Customer Portal**: Self-service subscription management
4. **Feature Gating**: Tier-based access control
5. **Usage Limits**: Enforce subscription restrictions
6. **Database Integration**: Sync with Supabase for user management

For the Shakabra project, this enables:
- Freemium SaaS model with Pro subscriptions
- 7-day free trials for Pro features
- Automatic subscription management
- Real-time feature access control
- Revenue tracking and analytics

The integration follows Stripe best practices for security, reliability, and user experience in a modern Next.js application.