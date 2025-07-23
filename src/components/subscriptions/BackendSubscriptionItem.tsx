import { useStripeProductName } from '@/hooks/useStripeProductName';
import { BORDER_RADIUS } from '@/utils/designSystem';
import { SubscriptionItemDetails } from './SubscriptionItemDetails';
import { SubscriptionItemHeader } from './SubscriptionItemHeader';

type BackendSubscriptionItemProps = {
  status: any;
  index: number;
};

export function BackendSubscriptionItem({ status, index }: BackendSubscriptionItemProps) {
  const device = status.device;
  const key = device?.tokenId ? `device-${device.tokenId}` : `status-${status.start_date}-${index}`;

  const { productName, loading } = useStripeProductName(status.stripe_id);

  return (
    <li key={key} className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
      <SubscriptionItemHeader
        stripeId={status.stripe_id}
        productName={productName}
        loading={loading}
        device={device}
      >
        <SubscriptionItemDetails status={status} device={device} />
      </SubscriptionItemHeader>
    </li>
  );
}
