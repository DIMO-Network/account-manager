'use client';

import type { BackendSubscription } from '@/types/subscription';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { CarIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

type ConnectionPlanSelectionProps = {
  subscription: BackendSubscription;
  vehicleTokenId: string;
};

type PlanDetails = {
  price_id: string;
  price: number;
  trial_period_days: number;
};

type PricingData = {
  [deviceType: string]: {
    monthly: PlanDetails;
    annual: PlanDetails;
  };
};

export function ConnectionPlanSelection({ subscription, vehicleTokenId }: ConnectionPlanSelectionProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const device = subscription.device;

  // Get manufacturer display name and map to backend device type
  const getManufacturerDisplayName = (manufacturerName: string) => {
    switch (manufacturerName) {
      case 'Ruptela':
        return 'R1';
      case 'AutoPi':
        return 'AUTO_PI';
      case 'HashDog':
        return 'MACARON';
      default:
        return manufacturerName;
    }
  };

  const getBackendDeviceType = (manufacturerName: string) => {
    switch (manufacturerName) {
      case 'Ruptela':
        return 'R1';
      case 'AutoPi':
        return 'AUTO_PI';
      case 'HashDog':
        return 'MACARON';
      case 'Tesla':
        return 'TESLA';
      default:
        return 'R1'; // Default fallback
    }
  };

  // Fetch pricing data from backend
  useEffect(() => {
    if (!device) {
      return;
    }

    const fetchPricing = async () => {
      try {
        setIsLoadingPricing(true);
        setPricingError(null);

        const response = await fetch('/api/subscriptions/pricing', {
          headers: {
            accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pricing: ${response.status} ${response.statusText}`);
        }

        const pricingData: PricingData = await response.json();

        // Validate that we have pricing for the device type
        const deviceType = getBackendDeviceType(device.manufacturer?.name || '');
        if (!pricingData[deviceType]) {
          throw new Error(`No pricing found for device type: ${deviceType}`);
        }

        setPricing(pricingData);
      } catch (error) {
        console.error('Error fetching pricing:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load pricing information';

        // Handle specific error cases
        if (errorMessage.includes('401') || errorMessage.includes('not authenticated')) {
          setPricingError('Please sign in to view pricing information');
        } else if (errorMessage.includes('No pricing found')) {
          setPricingError(`Pricing not available for ${getManufacturerDisplayName(device.manufacturer?.name || '')} devices`);
        } else {
          setPricingError(errorMessage);
        }
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [device, device?.manufacturer?.name]);

  if (!device) {
    return null;
  }

  const handleCreateSubscription = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/subscriptions/vehicle/${vehicleTokenId}/new-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      // Subscription created successfully
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating subscription:', error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.push(`/subscriptions/connection/${vehicleTokenId}`);
  };

  // Get device-specific pricing
  const deviceType = getBackendDeviceType(device.manufacturer?.name || '');
  const devicePricing = pricing?.[deviceType];

  // Calculate annual savings if pricing is available
  const annualSavings = devicePricing
    ? (devicePricing.monthly.price * 12) - devicePricing.annual.price
    : 0;

  const productName = getManufacturerDisplayName(device.manufacturer?.name || '');
  const vehicleDisplay = device.vehicle?.definition?.year && device.vehicle.definition?.make && device.vehicle.definition?.model
    ? `${device.vehicle.definition.year} ${device.vehicle.definition.make} ${device.vehicle.definition.model}`
    : `Vehicle ${vehicleTokenId}`;

  // Show loading state while fetching pricing
  if (isLoadingPricing) {
    return (
      <>
        <PageHeader icon={<CarIcon />} title="Edit Subscription" className="mb-4" />
        <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
          <div className="mb-8 px-4">
            <h3 className="font-medium text-base leading-6">
              Reactivate your subscription for
              {' '}
              {productName}
              {' '}
              connected to
              {' '}
              {vehicleDisplay}
            </h3>
          </div>
          <div className="px-4">
            <div className="text-center py-8">
              <div className="text-text-secondary">Loading pricing information...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state if pricing failed to load
  if (pricingError || !devicePricing) {
    return (
      <>
        <PageHeader icon={<CarIcon />} title="Edit Subscription" className="mb-4" />
        <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
          <div className="mb-8 px-4">
            <h3 className="font-medium text-base leading-6">
              Reactivate your subscription for
              {' '}
              {productName}
              {' '}
              connected to
              {' '}
              {vehicleDisplay}
            </h3>
          </div>
          <div className="px-4">
            <div className="text-center py-8">
              <div className="text-red-600 dark:text-red-400 mb-4">
                {pricingError || 'Unable to load pricing information'}
              </div>
              {pricingError?.includes('sign in')
                ? (
                    <button
                      onClick={() => router.push('/auth/signin')}
                      className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium px-4 py-2 ${COLORS.button.primary}`}
                      type="button"
                    >
                      Sign In
                    </button>
                  )
                : (
                    <button
                      onClick={() => window.location.reload()}
                      className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium px-4 py-2 ${COLORS.button.secondary}`}
                      type="button"
                    >
                      Try Again
                    </button>
                  )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader icon={<CarIcon />} title="Edit Subscription" className="mb-4" />
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="mb-8 px-4">
          <h3 className="font-medium text-base leading-6">
            Reactivate your subscription for
            {' '}
            {productName}
            {' '}
            connected to
            {' '}
            {vehicleDisplay}
          </h3>
          {subscription.stripe_id && subscription.status === 'canceled'
            ? (
                <p className="text-sm text-text-secondary mt-2">
                  Choose your plan below. No trial period - you'll be charged immediately.
                </p>
              )
            : (
                <p className="text-sm text-text-secondary mt-2">
                  Choose your plan below. You'll receive a
                  {' '}
                  {devicePricing?.annual.trial_period_days}
                  -day trial period.
                </p>
              )}
        </div>

        <div className="flex flex-col px-4 gap-3 mb-4">
          {/* Annual Plan */}
          <button
            type="button"
            className={`relative p-4 rounded-xl border border-surface-raised transition-all duration-200 cursor-pointer w-full text-left min-h-20 bg-surface-raised ${
              selectedPlan === 'annual'
                ? 'border-white'
                : 'border-gray-700'
            }`}
            onClick={() => setSelectedPlan('annual')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedPlan('annual');
              }
            }}
            aria-pressed={selectedPlan === 'annual'}
          >
            <div className="flex flex-col">
              <div className="font-medium text-base">
                Annually
              </div>
              <div className="text-sm text-text-secondary">
                $
                {devicePricing.annual.price.toFixed(2)}
                {' '}
                / year
              </div>
              {!(subscription.stripe_id && subscription.status === 'canceled') && (
                <div className="text-xs text-text-tertiary mt-1">
                  {devicePricing.annual.trial_period_days}
                  {' '}
                  day trial
                </div>
              )}
              {annualSavings > 0 && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Save $
                  {annualSavings.toFixed(2)}
                  /year
                </div>
              )}
            </div>
          </button>

          {/* Monthly Plan */}
          <button
            type="button"
            className={`relative p-4 rounded-xl border border-surface-raised transition-all duration-200 cursor-pointer w-full text-left min-h-20 bg-surface-raised ${
              selectedPlan === 'monthly'
                ? 'border-white'
                : 'border-gray-700'
            }`}
            onClick={() => setSelectedPlan('monthly')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedPlan('monthly');
              }
            }}
            aria-pressed={selectedPlan === 'monthly'}
          >
            <div className="flex flex-col">
              <div className="font-medium text-base">
                Monthly
              </div>
              <div className="text-sm text-text-secondary">
                $
                {devicePricing.monthly.price.toFixed(2)}
                {' '}
                / month
              </div>
              {!(subscription.stripe_id && subscription.status === 'canceled') && (
                <div className="text-xs text-text-tertiary mt-1">
                  {devicePricing.monthly.trial_period_days}
                  {' '}
                  day trial
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="px-4">
          <button
            onClick={handleCreateSubscription}
            className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
              isCreating
                ? COLORS.button.disabled
                : COLORS.button.primary
            }`}
            type="button"
            disabled={isCreating}
          >
            {isCreating
              ? 'Creating...'
              : (subscription.stripe_id && subscription.status === 'canceled')
                  ? 'Reactivate Subscription'
                  : 'Continue to Review'}
          </button>
          <button
            onClick={handleBack}
            className={`${RESPONSIVE.touch} ${COLORS.button.tertiary} ${BORDER_RADIUS.full} font-medium w-full mt-2`}
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    </>
  );
}
