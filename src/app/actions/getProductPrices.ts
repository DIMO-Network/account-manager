import { stripe } from '@/libs/Stripe';

export type ProductPrice = {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
    interval_count: number;
  };
};

export async function getProductPrices(productId: string): Promise<ProductPrice[]> {
  try {
    const prices = await stripe().prices.list({
      product: productId,
      active: true,
    });

    return prices.data.map(price => ({
      id: price.id,
      unit_amount: price.unit_amount || 0,
      currency: price.currency,
      recurring: {
        interval: price.recurring?.interval || 'month',
        interval_count: price.recurring?.interval_count || 1,
      },
    }));
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return [];
  }
}
