import { useStripeProductName } from '@/hooks/useStripeProductName';
import { BORDER_RADIUS } from '@/utils/designSystem';
import { memo } from 'react';
import type { BackendSubscription } from '@/types/subscription';
import { BackendSubscriptionDetails } from './BackendSubscriptionDetails';
import { BackendSubscriptionHeader } from './BackendSubscriptionHeader';

type BackendSubscriptionItemProps = {
  status: BackendSubscription;
};

export const BackendSubscriptionItem = memo(({ status }: BackendSubscriptionItemProps) => {
  const device = status.device;
  const key = device?.tokenId ? `device-${device.tokenId}` : `status-${status.start_date}-${status.status}`;
  const { productName, loading } = useStripeProductName(status.stripe_id ?? null);

  return (
    <li key={key} className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
      <BackendSubscriptionHeader
        stripeId={status.stripe_id ?? null}
        productName={productName}
        loading={loading}
        device={device}
        status={status.status}
      >
        <BackendSubscriptionDetails status={status} device={device} />
      </BackendSubscriptionHeader>
    </li>
  );
});
