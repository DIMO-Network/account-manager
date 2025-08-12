export default function ConnectionEditSubscriptionLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-3/4">
        <div className="bg-surface-default rounded-2xl p-6">
          <div className="animate-pulse space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-surface-sunken rounded"></div>
              <div className="h-6 bg-surface-sunken rounded w-48"></div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-2">
              <div className="h-4 bg-surface-sunken rounded w-24"></div>
              <div className="h-6 bg-surface-sunken rounded w-64"></div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-3">
              <div className="h-4 bg-surface-sunken rounded w-32"></div>
              <div className="space-y-2">
                <div className="h-20 bg-surface-sunken rounded"></div>
                <div className="h-20 bg-surface-sunken rounded"></div>
              </div>
            </div>

            {/* Button */}
            <div className="pt-4">
              <div className="h-12 bg-surface-sunken rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Section */}
      <div className="w-full lg:w-1/4">
        <div className="bg-surface-default rounded-2xl p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-surface-sunken rounded w-32"></div>
            <div className="h-16 bg-surface-sunken rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
