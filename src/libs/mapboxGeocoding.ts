import 'server-only';

type MapboxGeocodeResponse = {
  features?: { place_name?: string }[];
};

function getMapboxAccessToken(): string | undefined {
  return (
    process.env.MAPBOX_ACCESS_TOKEN
    ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    ?? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  );
}

/**
 * Reverse-geocode coordinates to a short place label (aligned with dimo-driver).
 * Returns undefined when coords are missing, token is unset, or the request fails.
 */
export async function getHumanReadableLocationString(
  lat?: number | null,
  lng?: number | null,
): Promise<string | undefined> {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return undefined;
  }

  const accessToken = getMapboxAccessToken();
  if (!accessToken) {
    return undefined;
  }

  const params = new URLSearchParams({
    limit: '1',
    types: 'place',
    access_token: accessToken,
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`;

  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) {
      console.error('Mapbox reverse geocode failed', response.status);
      return undefined;
    }

    const data = (await response.json()) as MapboxGeocodeResponse;
    const placeName = data.features?.[0]?.place_name ?? '';
    if (!placeName) {
      return undefined;
    }

    return placeName.split(',').slice(0, 2).join(',').trim();
  } catch (error) {
    console.error('Mapbox reverse geocode error', error);
    return undefined;
  }
}
