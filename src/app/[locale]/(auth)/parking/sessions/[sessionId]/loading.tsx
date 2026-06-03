import { ParkingSessionClientSkeleton } from '@/components/parking/ParkingSessionClientSkeleton';

export default function ParkingSessionLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <ParkingSessionClientSkeleton />
    </div>
  );
}
