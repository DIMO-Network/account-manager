import type { ParkingCorporateCheckout } from '@/types/parking-assist';

/** Matches parking-checkout-worker / dimo-app-backend failureCode. */
export const NO_PAYMENT_REQUIRED_FAILURE_CODE = 'no_payment_required';

export function isNoPaymentRequiredCheckout(
  checkout: Pick<ParkingCorporateCheckout, 'status' | 'failureCode'> | null | undefined,
): boolean {
  return checkout?.status === 'failed'
    && checkout.failureCode === NO_PAYMENT_REQUIRED_FAILURE_CODE;
}
