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
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const cancelAt = subscription.cancel_at;

  if (!currentPeriodEnd) {
    return { displayText: 'N/A', date: undefined };
  }

  const date = new Date(currentPeriodEnd * 1000).toLocaleDateString();

  if (cancelAtPeriodEnd && cancelAt) {
    const cancelDate = new Date(cancelAt * 1000).toLocaleDateString();
    return { displayText: `Cancels on ${cancelDate}`, date: cancelDate };
  }

  if (status === 'trialing') {
    return { displayText: `Free until ${date}`, date };
  } else if (status === 'active') {
    return { displayText: `Renews on ${date}`, date };
  } else if (status === 'canceled') {
    return { displayText: `Cancels on ${date}`, date };
  } else {
    return { displayText: date, date };
  }
}
