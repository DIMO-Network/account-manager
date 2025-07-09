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
    const cardId = searchParams.get('cardId');

    if (cardId && customerId) {
      const card = await stripe().paymentMethods.retrieve(cardId);
      if (card.customer !== customerId) {
        return NextResponse.json(
          { error: 'Card does not belong to this customer' },
          { status: 403 },
        );
      }
      return NextResponse.json({ card });
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 },
      );
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

    // Detach payment method from customer using Stripe's detach endpoint
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

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

      // Check if this is the first payment method for the customer
      const existingPaymentMethods = await stripe().paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      // If this is the first payment method, set it as default
      if (existingPaymentMethods.data.length === 1) {
        await stripe().customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error processing payment method request:', error);
    return NextResponse.json(
      { error: 'Failed to process payment method request' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { customerId, cardId, name, address_city, address_country, address_line1, address_line2, address_state, address_zip } = await request.json();

    if (!customerId || !cardId) {
      return NextResponse.json(
        { error: 'Customer ID and Card ID are required' },
        { status: 400 },
      );
    }

    // Update the payment method
    const updatedCard = await stripe().paymentMethods.update(cardId, {
      billing_details: {
        name,
        address: {
          city: address_city,
          country: address_country,
          line1: address_line1,
          line2: address_line2,
          state: address_state,
          postal_code: address_zip,
        },
      },
    });

    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 },
    );
  }
}
