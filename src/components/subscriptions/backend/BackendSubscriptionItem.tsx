import type { BackendSubscription } from '@/types/subscription';
import { useStripeProductName } from '@/hooks/useStripeProductName';
import { BORDER_RADIUS } from '@/utils/designSystem';
import { BackendSubscriptionDetails } from './BackendSubscriptionDetails';
import { BackendSubscriptionHeader } from './BackendSubscriptionHeader';

type BackendSubscriptionItemProps = {
  status: BackendSubscription;
  index: number;
};

export function BackendSubscriptionItem({ status, index }: BackendSubscriptionItemProps) {
  const device = status.device;
  const key = device?.tokenId ? `device-${device.tokenId}` : `status-${status.start_date}-${index}`;
  const { productName, loading } = useStripeProductName(status.stripe_id ?? null);

  return (
    <li key={key} className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
      <BackendSubscriptionHeader
        stripeId={status.stripe_id ?? null}
        productName={productName}
        loading={loading}
        device={device}
      >
        <BackendSubscriptionDetails status={status} device={device} />
      </BackendSubscriptionHeader>
    </li>
  );
}
