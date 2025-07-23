import type { NextRequest } from 'next/server';
import type { PaymentMethodsResponse } from '@/types/paymentMethod';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

async function authenticateUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    await authenticateUser(); // Verify user is authenticated

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const cardId = searchParams.get('cardId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 },
      );
    }

    // If cardId is provided, fetch specific payment method
    if (cardId) {
      try {
        const paymentMethod = await stripe().paymentMethods.retrieve(cardId);

        // Verify the payment method belongs to the customer
        if (paymentMethod.customer !== customerId) {
          return NextResponse.json(
            { error: 'Payment method not found' },
            { status: 404 },
          );
        }

        return NextResponse.json({ card: paymentMethod });
      } catch (error) {
        console.error('Error fetching payment method:', error);
        return NextResponse.json(
          { error: 'Payment method not found' },
          { status: 404 },
        );
      }
    }

    const paymentMethods = await stripe().paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 100,
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
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await authenticateUser(); // Verify user is authenticated

    const {
      cardId,
      customerId,
      name,
      address_city,
      address_country,
      address_line1,
      address_line2,
      address_state,
      address_zip,
    } = await request.json();

    if (!cardId || !customerId) {
      return NextResponse.json(
        { error: 'Card ID and Customer ID are required' },
        { status: 400 },
      );
    }

    // Update the payment method's billing details
    await stripe().paymentMethods.update(cardId, {
      billing_details: {
        name: name || undefined,
        address: {
          city: address_city || undefined,
          country: address_country || undefined,
          line1: address_line1 || undefined,
          line2: address_line2 || undefined,
          state: address_state || undefined,
          postal_code: address_zip || undefined,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment method:', error);
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authenticateUser(); // Verify user is authenticated

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 },
      );
    }

    // Detach payment method from customer using Stripe's detach endpoint
    await stripe().paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing payment method:', error);
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateUser(); // Verify user is authenticated

    const {
      customerId,
      paymentMethodId,
      billing_details,
      action,
    } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 },
      );
    }

    // Handle setting default payment method
    if (action === 'set_default' && paymentMethodId) {
      // Update customer's default payment method
      await stripe().customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      return NextResponse.json({ success: true });
    }

    // Handle adding new payment method
    if (paymentMethodId && billing_details) {
      const existingPaymentMethods = await stripe().paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      const isFirstPaymentMethod = existingPaymentMethods.data.length === 0;

      // Attach the payment method to the customer
      await stripe().paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Update billing details if provided
      await stripe().paymentMethods.update(paymentMethodId, {
        billing_details: {
          name: billing_details.name,
          address: {
            city: billing_details.address?.city,
            country: billing_details.address?.country,
            line1: billing_details.address?.line1,
            line2: billing_details.address?.line2,
            state: billing_details.address?.state,
            postal_code: billing_details.address?.postal_code,
          },
        },
      });

      // Set as default if it's the first payment method
      if (isFirstPaymentMethod) {
        await stripe().customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error adding payment method:', error);
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 },
    );
  }
}
