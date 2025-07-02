import Link from 'next/link';
import { CarIcon } from '@/components/Icons';
import { COLORS } from '@/utils/designSystem';

type SubscriptionsClientProps = {
  subscriptions: any[];
};

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
  let content;
  if (!subscriptions || subscriptions.length === 0) {
    content = <p>No subscriptions found.</p>;
  } else {
    content = (
      <ul className="space-y-4">
        {subscriptions.map(sub => (
          <li key={sub.id} className="border rounded p-4">
            <Link href={`/subscriptions/${sub.id}`} className="block hover:bg-gray-50 transition rounded p-2 -m-2">
              <div>
                <strong>ID:</strong>
                {' '}
                {sub.id}
              </div>
              <div>
                <strong>Status:</strong>
                {' '}
                {sub.status}
              </div>
              <div>
                <strong>Start Date:</strong>
                {' '}
                {sub.start_date ? new Date(sub.start_date * 1000).toLocaleDateString() : 'N/A'}
              </div>
              {/* TODO: Add more details as needed */}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Subscriptions</h1>
      </div>
      {content}
    </div>
  );
}

export default SubscriptionsClient;
