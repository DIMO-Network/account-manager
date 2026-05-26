import { describe, expect, it } from 'vitest';
import { isNoPaymentRequiredCheckout, NO_PAYMENT_REQUIRED_FAILURE_CODE } from './parking-checkout';

describe('isNoPaymentRequiredCheckout', () => {
  it('returns true for failed checkout with no_payment_required code', () => {
    expect(
      isNoPaymentRequiredCheckout({
        status: 'failed',
        failureCode: NO_PAYMENT_REQUIRED_FAILURE_CODE,
      }),
    ).toBe(true);
  });

  it('returns false for other failures', () => {
    expect(
      isNoPaymentRequiredCheckout({
        status: 'failed',
        failureCode: 'automation_error',
      }),
    ).toBe(false);
  });
});
