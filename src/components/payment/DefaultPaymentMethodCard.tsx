import type Stripe from 'stripe';

type DefaultPaymentMethodCardProps = {
  paymentMethod: Stripe.PaymentMethod;
};

export function DefaultPaymentMethodCard({ paymentMethod }: DefaultPaymentMethodCardProps) {
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return null;
  }
  const card = paymentMethod.card;
  const formatCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'amex':
        return 'American Express';
      case 'mastercard':
        return 'Mastercard';
      case 'visa':
        return 'Visa';
      case 'discover':
        return 'Discover';
      case 'diners':
        return 'Diners Club';
      case 'jcb':
        return 'JCB';
      case 'unionpay':
        return 'Union Pay';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };
  return (
    <div className="flex flex-col">
      <span className="font-medium text-white">
        {formatCardBrand(card.brand)}
        {' '}
        ••••
        {card.last4}
      </span>
      <span className="text-xs text-grey-400 mt-1">
        Expires
        {' '}
        {String(card.exp_month).padStart(2, '0')}
        /
        {card.exp_year}
      </span>
      {paymentMethod.billing_details?.name && (
        <span className="text-xs text-grey-500">
          {paymentMethod.billing_details.name}
        </span>
      )}
    </div>
  );
}
