export type ParkingCorporateCheckoutStatus
  = | 'pending'
    | 'running'
    | 'paid'
    | 'failed'
    | 'cancelled';

export type ParkingService = 'parkdetroit' | 'parkmobile';

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
  parkingService: ParkingService;
  durationMinutes: number | null;
  paidAt: string | null;
  automationRunId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ParkingAssistSession = {
  id: string;
  vehicleTokenId: number;
  triggeredAt: string;
  triggerLatitude: number | null;
  triggerLongitude: number | null;
  createdAt: string;
};

export type ParkingVehicleDefinition = {
  year: number | null;
  make: string | null;
  model: string | null;
};

export type ParkingAssistSessionDetail = {
  session: ParkingAssistSession;
  vehicleDisplayName: string | null;
  vehicleDefinition?: ParkingVehicleDefinition | null;
  vehicleLicensePlate: string | null;
  vehicleCountry: string | null;
  vehicleState: string | null;
  latestCheckout: ParkingCorporateCheckout | null;
  suggestedParkingServiceId: ParkingService | null;
  suggestedCoverageLabel: string | null;
};

export type ParkingAssistHistoryItem = {
  session: ParkingAssistSession;
  vehicleDisplayName: string | null;
  vehicleLicensePlate: string | null;
  vehicleCountry: string | null;
  vehicleState: string | null;
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

export type ParkingServiceDurationOption = {
  minutes: number;
  label: string;
};

export type ParkingServiceCatalogEntry = {
  id: ParkingService;
  label: string;
  zoneCodeHint: string;
  defaultDurationMinutes: number;
  durationOptions: ParkingServiceDurationOption[];
};

export type ParkingServicesCatalog = {
  services: ParkingServiceCatalogEntry[];
};

export type StartCorporateCheckoutRequest = {
  zoneCode: string;
  durationMinutes: number;
  parkingService?: ParkingService;
};
