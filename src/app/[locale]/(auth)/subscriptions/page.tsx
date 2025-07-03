import type Stripe from 'stripe';
import { getTranslations } from 'next-intl/server';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { stripe } from '@/libs/Stripe';
import { SubscriptionsClient } from './SubscriptionsClient';

type EnhancedSubscription = Stripe.Subscription & {
  productName: string;
  vehicleDisplay: string;
};

async function getProductInfo(productId: string): Promise<{ name: string } | null> {
  try {
    const product = await stripe().products.retrieve(productId);
    return { name: product.name };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

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
  let subscriptions: EnhancedSubscription[] = [];

  if (customerResult.success && customerResult.customerId) {
    const customerId = customerResult.customerId;
    const subs = await stripe().subscriptions.list({
      customer: customerId,
      expand: ['data.items.data.price'],
    });

    const enhancedSubscriptions = await Promise.all(
      subs.data.map(async (sub) => {
        const itemsWithProducts = await Promise.all(
          sub.items.data.map(async (item) => {
            const productId = typeof item.price.product === 'string'
              ? item.price.product
              : item.price.product?.id;

            const productInfo = productId ? await getProductInfo(productId) : null;

            return {
              ...item,
              price: {
                ...item.price,
                product: productInfo,
              },
            };
          }),
        );

        return {
          ...sub,
          items: {
            ...sub.items,
            data: itemsWithProducts,
          },
        };
      }),
    );

    // Get vehicle information for each subscription
    const subscriptionsWithVehicles = await Promise.all(
      enhancedSubscriptions.map(async (sub) => {
        const vehicleTokenId = sub.metadata?.vehicleTokenId;
        let vehicleInfo;

        if (vehicleTokenId) {
          const result = await getDimoVehicleDetails(vehicleTokenId);
          vehicleInfo = result.success ? result.vehicle : null;
        }

        return {
          ...sub,
          vehicleInfo,
        };
      }),
    );

    const simplifiedSubscriptions = subscriptionsWithVehicles.map(sub => ({
      ...sub,
      productName: sub.items?.data?.[0]?.price?.product?.name || `Subscription ${sub.id}`,
      vehicleDisplay: sub.vehicleInfo?.definition?.year && sub.vehicleInfo?.definition?.make && sub.vehicleInfo?.definition?.model
        ? `${sub.vehicleInfo.definition.year} ${sub.vehicleInfo.definition.make} ${sub.vehicleInfo.definition.model}`
        : sub.metadata?.vehicleTokenId || 'N/A',
    }));

    subscriptions = simplifiedSubscriptions as unknown as EnhancedSubscription[];
  }

  return <SubscriptionsClient subscriptions={subscriptions} />;
}
