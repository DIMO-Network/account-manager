// ============================================================================
// SHARED UTILITY FUNCTIONS
// ============================================================================

// Helper function to format price with interval
function formatPriceWithInterval(amountCents: number | null | undefined, interval?: string): string {
  if (!amountCents) {
    return 'N/A';
  }
  const amount = (amountCents / 100).toFixed(2);
  const intervalText = interval === 'year' ? '/year' : '/month';
  return `$${amount}${intervalText}`;
}

// Helper function to format product name
export function formatProductName(productName: string | null): string | null {
  if (!productName) {
    return null;
  }

  // Extract just "DIMO Pro" from "DIMO Pro (R1, Tesla, AutoPi)"
  const match = productName.match(/^DIMO Pro/);
  return match ? match[0] : productName;
}

// ============================================================================
// BACKEND SUBSCRIPTION DISPLAY HELPERS
// ============================================================================

// Helper function for backend status display
export function getStatusDisplay(status: any) {
  const isActive = status.status === 'active' || status.status === 'trialing' || status.status === 'trialing_active';
  const isTrialing = status.status === 'trialing' || status.status === 'trialing_active';
  const isIncomplete = status.new_status === 'trialing_incomplete';

  let statusText = status.new_status;
  let statusColor = 'text-text-secondary';

  if (isActive) {
    statusColor = 'text-green-500';
    if (isTrialing) {
      statusText = 'Trial Active';
    } else {
      statusText = 'Active';
    }
  } else if (isIncomplete) {
    statusColor = 'text-yellow-500';
    statusText = 'Trial Incomplete';
  } else if (status.status === 'canceled') {
    statusColor = 'text-red-500';
    statusText = 'Canceled';
  } else if (status.status === 'cancel_scheduled') {
    statusColor = 'text-orange-500';
    statusText = 'Scheduled To Cancel';
  }

  return { text: statusText, color: statusColor };
}

// Helper function for backend subscription renewal info
const formatDate = (dateString: string | null) => {
  if (!dateString) {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
};

export function getBackendSubscriptionRenewalInfo(status: {
  new_status: string;
  cancel_at: string | null;
  next_renewal_date: string | null;
  trial_end: string | null;
}, device?: any) {
  // For trialing_incomplete status, show trial_end if cancel_at is null
  if (status.new_status === 'trialing_incomplete') {
    if (status.cancel_at) {
      return { displayText: `Cancels on ${formatDate(status.cancel_at)}`, date: formatDate(status.cancel_at) };
    }
    if (status.trial_end) {
      // Only show grandfathered device message for actual grandfathered devices (not Tesla connections)
      const isGrandfatheredDevice = device?.manufacturer?.name === 'Ruptela' || device?.manufacturer?.name === 'HashDog' || device?.manufacturer?.name === 'AutoPi';
      const secondaryText = isGrandfatheredDevice ? 'This is a grandfathered device with extended trial period.' : undefined;

      return {
        displayText: `Trial ends on ${formatDate(status.trial_end)}`,
        secondaryText,
        date: formatDate(status.trial_end),
      };
    }
  }

  // For cancel_scheduled status, prioritize showing cancellation message
  if (status.new_status === 'cancel_scheduled' && status.cancel_at) {
    return { displayText: `Cancels on ${formatDate(status.cancel_at)}`, date: formatDate(status.cancel_at) };
  }

  if (status.cancel_at) {
    return { displayText: `Cancels on ${formatDate(status.cancel_at)}`, date: formatDate(status.cancel_at) };
  }
  if (status.next_renewal_date) {
    return { displayText: `Renews on ${formatDate(status.next_renewal_date)}`, date: formatDate(status.next_renewal_date) };
  }
  if (status.trial_end) {
    // Only show grandfathered device message for actual grandfathered devices (not Tesla connections)
    const isGrandfatheredDevice = device?.manufacturer?.name === 'Ruptela' || device?.manufacturer?.name === 'HashDog' || device?.manufacturer?.name === 'AutoPi';
    const secondaryText = isGrandfatheredDevice ? 'This is a grandfathered device with extended trial period.' : undefined;

    return {
      displayText: `Trial ends on ${formatDate(status.trial_end)}`,
      secondaryText,
      date: formatDate(status.trial_end),
    };
  }
  return { displayText: 'N/A', date: undefined };
}

// Helper function to get device display name (used by backend subscriptions)
export function getDeviceDisplayName(device: any): string {
  if (device?.vehicle?.definition) {
    return `${device.vehicle.definition.make} ${device.vehicle.definition.model}`;
  }

  if (device?.manufacturer?.name === 'HashDog') {
    return 'Macaron';
  }

  if (device?.manufacturer?.name === 'Ruptela') {
    return 'R1';
  }

  return device?.manufacturer?.name || 'Unknown Device';
}

// Helper function to get device header name (for non-Stripe subscriptions)
export function getDeviceHeaderName(device: any): string {
  // For Ruptela, HashDog, AutoPi devices, and Tesla software subscriptions, show "DIMO Pro" consistently
  if (device?.manufacturer?.name === 'Ruptela' || device?.manufacturer?.name === 'HashDog' || device?.manufacturer?.name === 'AutoPi' || device?.connection?.name === 'Tesla') {
    return 'DIMO Pro';
  }

  // For devices with vehicle definitions, show vehicle info
  if (device?.vehicle?.definition) {
    return `${device.vehicle.definition.make} ${device.vehicle.definition.model}`;
  }

  // For other manufacturers, show manufacturer name
  return device?.manufacturer?.name || 'Unknown Device';
}

// ============================================================================
// STRIPE SUBSCRIPTION DISPLAY HELPERS
// ============================================================================

// Helper function for Stripe subscription renewal info
export function getStripeSubscriptionRenewalInfo(
  subscription: any,
  nextScheduledPrice?: any,
  nextScheduledDate?: number | null,
) {
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const cancelAt = subscription.cancel_at;

  if (!currentPeriodEnd) {
    return { displayText: 'N/A', date: undefined };
  }

  const date = formatDate(new Date(currentPeriodEnd * 1000).toISOString());

  // Handle scheduled changes first
  if (nextScheduledPrice && nextScheduledDate) {
    const nextDate = formatDate(new Date(nextScheduledDate * 1000).toISOString());
    const nextAmount = formatPriceWithInterval(nextScheduledPrice.unit_amount, nextScheduledPrice.recurring?.interval);
    const scheduledChangeText = `${nextDate} at ${nextAmount}`;

    // Determine the appropriate label based on subscription status
    if (cancelAtPeriodEnd && cancelAt) {
      return { displayText: `Cancels on ${scheduledChangeText}`, date: nextDate };
    } else if (status === 'active') {
      return { displayText: `Renews on ${scheduledChangeText}`, date: nextDate };
    } else if (status === 'canceled') {
      const canceledAt = subscription.canceled_at;
      if (canceledAt) {
        const canceledDate = formatDate(new Date(canceledAt * 1000).toISOString());
        return { displayText: `Canceled on ${canceledDate}`, date: canceledDate };
      }
      return { displayText: `Canceled`, date: nextDate };
    } else if (status === 'trialing') {
      // For trialing subscriptions with scheduled changes, show both trial end and plan change
      const currentInterval = subscription.items?.data?.[0]?.price?.recurring?.interval;
      const nextInterval = nextScheduledPrice.recurring?.interval;

      // Check if this is an interval change (monthly to annual or vice versa)
      if (currentInterval && nextInterval && currentInterval !== nextInterval) {
        const intervalText = nextInterval === 'year' ? 'annual' : 'monthly';
        return {
          displayText: `Free until ${date}`,
          secondaryText: `Your plan will switch to ${intervalText} and your payment method will be charged ${nextAmount} on ${nextDate}.`,
          date: nextDate,
        };
      } else {
        // For other scheduled changes during trial
        return {
          displayText: `Free until ${date}`,
          secondaryText: `Your plan will change to ${nextAmount} on ${nextDate}.`,
          date: nextDate,
        };
      }
    } else {
      return { displayText: scheduledChangeText, date: nextDate };
    }
  }

  // Fall back to regular renewal/cancellation logic
  if (cancelAtPeriodEnd && cancelAt) {
    const cancelDate = formatDate(new Date(cancelAt * 1000).toISOString());
    return { displayText: `Cancels on ${cancelDate}`, date: cancelDate };
  }

  // Check for cancel_at regardless of status (including trialing)
  if (cancelAt) {
    const cancelDate = formatDate(new Date(cancelAt * 1000).toISOString());
    return { displayText: `Cancels on ${cancelDate}`, date: cancelDate };
  }

  if (status === 'trialing') {
    // Check if this is a trialing subscription that has been updated to a different interval
    const currentPrice = subscription.items?.data?.[0]?.price;
    if (currentPrice && currentPrice.recurring?.interval) {
      const interval = currentPrice.recurring.interval;
      const amount = formatPriceWithInterval(currentPrice.unit_amount, interval);
      const intervalText = interval === 'year' ? 'annual' : 'monthly';

      return {
        displayText: `Free until ${date}`,
        secondaryText: `Your plan will switch to ${intervalText} and your payment method will be charged ${amount} on ${date}`,
        date,
      };
    }
    return { displayText: `Free until ${date}`, date };
  } else if (status === 'active') {
    return { displayText: `Renews on ${date}`, date };
  } else if (status === 'canceled') {
    const canceledAt = subscription.canceled_at;
    if (canceledAt) {
      const canceledDate = formatDate(new Date(canceledAt * 1000).toISOString());
      return { displayText: `Canceled on ${canceledDate}`, date: canceledDate };
    }
    return { displayText: `Canceled`, date };
  } else {
    return { displayText: date, date };
  }
}

// Helper function for Stripe subscription status display
export function getStripeStatusDisplay(subscription: any) {
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isTrialing = subscription.status === 'trialing';
  const isCanceled = subscription.status === 'canceled';
  const isIncomplete = subscription.status === 'incomplete' || subscription.status === 'incomplete_expired';
  const isUnpaid = subscription.status === 'unpaid';
  const isPastDue = subscription.status === 'past_due';
  const isMarkedForCancellation = subscription.cancel_at_period_end || !!subscription.cancel_at;

  let statusText = subscription.status;
  let statusColor = 'text-text-secondary';

  if (isActive) {
    statusColor = 'text-green-500';
    if (isTrialing) {
      statusText = 'Trial Active';
    } else {
      statusText = 'Active';
    }
  } else if (isMarkedForCancellation) {
    statusColor = 'text-orange-500';
    statusText = 'Scheduled To Cancel';
  } else if (isCanceled) {
    statusColor = 'text-red-500';
    statusText = 'Canceled';
  } else if (isIncomplete) {
    statusColor = 'text-yellow-500';
    statusText = 'Incomplete';
  } else if (isUnpaid) {
    statusColor = 'text-red-500';
    statusText = 'Unpaid';
  } else if (isPastDue) {
    statusColor = 'text-orange-500';
    statusText = 'Past Due';
  }

  return { text: statusText, color: statusColor };
}
