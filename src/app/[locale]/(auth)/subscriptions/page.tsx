import type Stripe from 'stripe';
import { getTranslations } from 'next-intl/server';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { stripe } from '@/libs/Stripe';
import { SubscriptionsClient } from './SubscriptionsClient';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Subscriptions',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function SubscriptionsPage() {
  const customerResult = await getOrCreateStripeCustomer();
  let subscriptions: Stripe.Subscription[] = [];
  if (customerResult.success && customerResult.customerId) {
    const customerId = customerResult.customerId;
    const subs = await stripe().subscriptions.list({ customer: customerId });
    subscriptions = subs.data as Stripe.Subscription[];
  }
  return <SubscriptionsClient subscriptions={subscriptions} />;
}
