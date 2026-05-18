export type ParkingCorporateCheckoutStatus
  = | 'pending'
    | 'running'
    | 'paid'
    | 'failed'
    | 'cancelled';

export type ParkingCorporateCheckout = {
  id: string;
  status: ParkingCorporateCheckoutStatus;
  failureCode: string | null;
  failureMessage: string | null;
  flowbirdReference: string | null;
  amountCents: number | null;
  currency: string | null;
  zoneId: string | null;
  zoneLabel: string | null;
  licensePlate: string | null;
  maxDurationMinutes: number | null;
  paidAt: string | null;
  automationRunId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ParkingAssistSession = {
  id: string;
  vehicleTokenId: number;
  triggeredAt: string;
  createdAt: string;
};

export type ParkingAssistSessionDetail = {
  session: ParkingAssistSession;
  vehicleDisplayName: string | null;
  latestCheckout: ParkingCorporateCheckout | null;
};

export type ParkingAssistHistoryItem = {
  session: ParkingAssistSession;
  vehicleDisplayName: string | null;
  latestCheckout: ParkingCorporateCheckout | null;
};

export type ParkingAssistHistory = {
  items: ParkingAssistHistoryItem[];
  total: number;
  limit: number;
  offset: number;
};

export type StartCorporateCheckoutResponse = {
  checkoutId: string;
  status: string;
  idempotencyKey: string;
};
