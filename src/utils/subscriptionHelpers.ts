import type Stripe from 'stripe';

export function getSubscriptionTypeAndPrice(subscription: Stripe.Subscription) {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  const priceCents = subscription.items?.data?.[0]?.price?.unit_amount;

  let priceFormatted = '';
  if (typeof priceCents === 'number') {
    priceFormatted = ` ($${(priceCents / 100).toFixed(2)})`;
  }

  let type = 'N/A';
  if (interval === 'month') {
    type = 'Monthly';
  } else if (interval === 'year') {
    type = 'Annually';
  }

  return { type, priceFormatted, displayText: `${type}${priceFormatted}` };
}

export function getSubscriptionRenewalInfo(subscription: Stripe.Subscription) {
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  const status = subscription.status;

  if (!currentPeriodEnd) {
    return { displayText: 'N/A' };
  }

  const date = new Date(currentPeriodEnd * 1000).toLocaleDateString();

  if (status === 'trialing') {
    return { displayText: `Free until ${date}` };
  } else if (status === 'active') {
    return { displayText: `Renews on ${date}` };
  } else if (status === 'canceled') {
    return { displayText: `Cancels on ${date}` };
  } else {
    return { displayText: date };
  }
}
