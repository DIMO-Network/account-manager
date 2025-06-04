import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { stripe } from '@/libs/Stripe';
import { deviceSubscriptionSchema } from '@/models/Schema';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 },
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 },
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const serialNumber = session.metadata?.serial_number;
  if (!serialNumber) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await db.insert(deviceSubscriptionSchema).values({
    serialNumber,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    planType: 'basic',
    isActive: subscription.status === 'active',
  }).onConflictDoUpdate({
    target: deviceSubscriptionSchema.serialNumber,
    set: {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      isActive: subscription.status === 'active',
      updatedAt: new Date(),
    },
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  const serialNumber = subscription.metadata?.serial_number;
  if (!serialNumber) {
    return;
  }

  await db.update(deviceSubscriptionSchema)
    .set({
      subscriptionStatus: subscription.status,
      isActive: subscription.status === 'active',
      updatedAt: new Date(),
    })
    .where(eq(deviceSubscriptionSchema.serialNumber, serialNumber));
}

async function handleSubscriptionDeleted(subscription: any) {
  const serialNumber = subscription.metadata?.serial_number;
  if (!serialNumber) {
    return;
  }

  await db.update(deviceSubscriptionSchema)
    .set({
      subscriptionStatus: 'canceled',
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(deviceSubscriptionSchema.serialNumber, serialNumber));
}

async function handlePaymentSucceeded(invoice: any) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const serialNumber = subscription.metadata?.serial_number;
  if (!serialNumber) {
    return;
  }

  await db.update(deviceSubscriptionSchema)
    .set({
      subscriptionStatus: 'active',
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(deviceSubscriptionSchema.serialNumber, serialNumber));
}

async function handlePaymentFailed(invoice: any) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const serialNumber = subscription.metadata?.serial_number;
  if (!serialNumber) {
    return;
  }

  await db.update(deviceSubscriptionSchema)
    .set({
      subscriptionStatus: 'past_due',
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(deviceSubscriptionSchema.serialNumber, serialNumber));
}
