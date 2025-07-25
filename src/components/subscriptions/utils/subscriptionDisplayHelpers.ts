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

// Helper function to format product name
export function formatProductName(productName: string | null): string | null {
  if (!productName) {
    return null;
  }

  // Extract just "DIMO Pro" from "DIMO Pro (R1, Tesla, AutoPi)"
  const match = productName.match(/^DIMO Pro/);
  return match ? match[0] : productName;
}

// Helper function to get device display name
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
  if (device?.vehicle?.definition) {
    return `${device.vehicle.definition.make} ${device.vehicle.definition.model}`;
  }

  // For detached devices, show "DIMO Pro" consistently
  if (device?.manufacturer?.name === 'HashDog' || device?.manufacturer?.name === 'Ruptela') {
    return 'DIMO Pro';
  }

  return device?.manufacturer?.name || 'Unknown Device';
}

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

  const date = new Date(currentPeriodEnd * 1000).toLocaleDateString();

  // Handle scheduled changes first
  if (nextScheduledPrice && nextScheduledDate) {
    const nextDate = new Date(nextScheduledDate * 1000).toLocaleDateString();
    const nextAmount = formatPriceWithInterval(nextScheduledPrice.unit_amount, nextScheduledPrice.recurring?.interval);
    const scheduledChangeText = `${nextDate} at ${nextAmount}`;

    // Determine the appropriate label based on subscription status
    if (cancelAtPeriodEnd && cancelAt) {
      return { displayText: `Cancels on ${scheduledChangeText}`, date: nextDate };
    } else if (status === 'active') {
      return { displayText: `Renews on ${scheduledChangeText}`, date: nextDate };
    } else if (status === 'canceled') {
      return { displayText: `Cancels on ${scheduledChangeText}`, date: nextDate };
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
    const cancelDate = new Date(cancelAt * 1000).toLocaleDateString();
    return { displayText: `Cancels on ${cancelDate}`, date: cancelDate };
  }

  // Check for cancel_at regardless of status (including trialing)
  if (cancelAt) {
    const cancelDate = new Date(cancelAt * 1000).toLocaleDateString();
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
    return { displayText: `Cancels on ${date}`, date };
  } else {
    return { displayText: date, date };
  }
}

// Helper function for backend subscription renewal info
export function getBackendSubscriptionRenewalInfo(status: {
  new_status: string;
  cancel_at: string | null;
  next_renewal_date: string | null;
  trial_end: string | null;
}) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // For trialing_incomplete status, show trial_end if cancel_at is null
  if (status.new_status === 'trialing_incomplete') {
    if (status.cancel_at) {
      return { displayText: `Cancels on ${formatDate(status.cancel_at)}`, date: formatDate(status.cancel_at) };
    }
    if (status.trial_end) {
      return { displayText: `Trial ends on ${formatDate(status.trial_end)}`, date: formatDate(status.trial_end) };
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
    return { displayText: `Trial ends on ${formatDate(status.trial_end)}`, date: formatDate(status.trial_end) };
  }
  return { displayText: 'N/A', date: undefined };
}

// Helper function to format price with interval
function formatPriceWithInterval(amountCents: number | null | undefined, interval?: string): string {
  if (!amountCents) {
    return 'N/A';
  }
  const amount = (amountCents / 100).toFixed(2);
  const intervalText = interval === 'year' ? '/year' : '/month';
  return `$${amount}${intervalText}`;
}
