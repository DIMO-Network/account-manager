import type Stripe from 'stripe';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { stripe } from '@/libs/Stripe';
import { BORDER_RADIUS, COLORS, SPACING } from '@/utils/designSystem';
import { PaymentMethodClient } from './PaymentMethodClient';
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
  let customerId: string | null = null;

  if (customerResult.success && customerResult.customerId) {
    customerId = customerResult.customerId;
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-3/4">
        <SubscriptionsClient subscriptions={subscriptions} />
      </div>
      <PaymentMethodSection />
    </div>
  );
}

export function PaymentMethodSection() {
  return (
    <div className="hidden lg:flex flex-col lg:w-1/4 gap-4">
      <div className={`hidden lg:flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.xs}`}>
        <div className="mb-4">
          <WalletIcon className="w-4 h-4" />
        </div>
        <PaymentMethodClient />
        <div className="mt-6 flex justify-center">
          <Link
            href="/payment-methods"
            className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 font-medium w-full h-10"
          >
            Edit
          </Link>
        </div>
      </div>
      <div className={`hidden lg:flex flex-col ${BORDER_RADIUS.lg} bg-surface-raised ${SPACING.xs}`}>
        <PaymentMethodsNote />
      </div>
    </div>
  );
}
