import Link from 'next/link';

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
    <div className="py-5 [&_p]:my-6">
      <h1 className="text-2xl font-bold mb-4">Subscriptions</h1>
      {content}
    </div>
  );
}

export default SubscriptionsClient;
