export type DIMOProfile = {
  id: string;
  email?: {
    address: string;
    confirmedAt: string;
  };
  wallet?: {
    address: string;
  };
  referral?: {
    code: string;
    referredAt?: string;
    referredBy?: string;
  };
  countryCode?: string;
  acceptedTosAt?: string;
  createdAt: string;
  updatedAt: string;
};
