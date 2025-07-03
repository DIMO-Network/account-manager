import type Stripe from 'stripe';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { stripe } from '@/libs/Stripe';
import { BORDER_RADIUS, COLORS, SPACING } from '@/utils/designSystem';
import { PaymentMethodClient } from '../subscriptions/PaymentMethodClient';
import { SubscriptionsClient } from '../subscriptions/SubscriptionsClient';

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

function PaymentMethodSection() {
  return (
    <div className="flex flex-col gap-4 lg:w-1/4 w-full order-1 lg:order-2">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 lg:hidden">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Payment Method</h1>
      </div>
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.xs} lg:block`}>
        <div className="mb-4 hidden lg:block">
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
      <div className={`flex flex-col ${BORDER_RADIUS.lg} bg-surface-raised ${SPACING.xs} lg:block`}>
        <PaymentMethodsNote />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
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
      <PaymentMethodSection />
      <div className="w-full lg:w-3/4 order-2 lg:order-1">
        <SubscriptionsClient subscriptions={subscriptions} />
      </div>
    </div>
  );
}
