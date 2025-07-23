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
