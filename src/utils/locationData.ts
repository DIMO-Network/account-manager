import type { Option } from '@/components/ui/Dropdown';

// Types for the JSON data
type CountryData = {
  name: string;
  iso2: string;
  currency: string;
  currency_symbol: string;
  emoji: string;
  region: string;
  numeric_code: string;
  native: string;
};

// Cache for loaded data
let countriesCache: Option[] | null = null;

export async function getCountries(): Promise<Option[]> {
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const response = await fetch('/data/countries.json');
    const countries: CountryData[] = await response.json();

    countriesCache = countries.map(country => ({
      label: country.name,
      value: country.iso2, // Use ISO-2 as required by Stripe
    }));

    return countriesCache;
  } catch (error) {
    console.error('Failed to load countries:', error);
    return [];
  }
}

// Helper function to get country name from ISO-2 code
export async function getCountryName(iso2Code: string): Promise<string | null> {
  const countries = await getCountries();
  const country = countries.find(c => c.value === iso2Code);
  return country?.label || null;
}
