import "server-only";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlaceDetailsResponse = {
  result?: {
    address_components?: GoogleAddressComponent[];
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
    place_id?: string;
  };
  status?: string;
};

export type ValidatedPlace = {
  formattedAddress: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  province: string | null;
  country: string | null;
};

function getGooglePlacesServerKey() {
  return process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

function getAddressComponent(components: GoogleAddressComponent[] | undefined, types: string[]) {
  return components?.find((component) => types.some((type) => component.types.includes(type)))?.long_name ?? null;
}

export async function validateGooglePlaceId(placeId: string): Promise<ValidatedPlace> {
  const apiKey = getGooglePlacesServerKey().trim();

  if (!apiKey) {
    throw new Error("Address validation is not configured.");
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "address_component,formatted_address,geometry,place_id",
    key: apiKey,
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Address validation failed.");
  }

  const payload = (await response.json()) as GooglePlaceDetailsResponse;
  const result = payload.result;

  if (payload.status !== "OK" || !result?.place_id || !result.formatted_address) {
    throw new Error("Select a valid Google Maps address.");
  }

  return {
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
    latitude: typeof result.geometry?.location?.lat === "number" ? result.geometry.location.lat : null,
    longitude: typeof result.geometry?.location?.lng === "number" ? result.geometry.location.lng : null,
    city: getAddressComponent(result.address_components, [
      "locality",
      "postal_town",
      "administrative_area_level_3",
      "administrative_area_level_2",
    ]),
    province: getAddressComponent(result.address_components, ["administrative_area_level_1"]),
    country: getAddressComponent(result.address_components, ["country"]),
  };
}
