import type { NextRequest } from 'next/server';
import type { PaymentMethodsResponse } from '@/types/paymentMethod';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 },
      );
    }

    // Fetch payment methods from Stripe using their official API
    const paymentMethods = await stripe().paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 100, // Get all payment methods
    });

    // Fetch customer's default payment method
    const customer = await stripe().customers.retrieve(customerId);
    let defaultPaymentMethodId: string | null = null;

    // Type guard to check if customer is not deleted
    if (customer && !customer.deleted) {
      const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
      if (defaultPaymentMethod) {
        defaultPaymentMethodId = typeof defaultPaymentMethod === 'string'
          ? defaultPaymentMethod
          : defaultPaymentMethod.id;
      }
    }

    const response: PaymentMethodsResponse = {
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 },
      );
    }

    // Detach payment method from customer using Stripe's official API
    await stripe().paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { paymentMethodId, customerId } = await request.json();

    if (!paymentMethodId || !customerId) {
      return NextResponse.json(
        { error: 'Payment method ID and customer ID are required' },
        { status: 400 },
      );
    }

    // Update customer's default payment method using Stripe's official API
    await stripe().customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: 'Failed to set default payment method' },
      { status: 500 },
    );
  }
}
