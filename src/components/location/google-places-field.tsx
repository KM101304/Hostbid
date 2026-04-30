"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type GooglePlaceSelection = {
  address: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  province: string | null;
  country: string | null;
};

type GooglePlacesFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  placeId: string;
  latitude?: number | null;
  longitude?: number | null;
  required?: boolean;
  onChange: (selection: GooglePlaceSelection) => void;
};

type GooglePlaceResult = {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
  place_id?: string;
};

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleAutocomplete = {
  addListener: (eventName: "place_changed", callback: () => void) => { remove: () => void };
  getPlace: () => GooglePlaceResult;
};

type GoogleMapsNamespace = {
  maps: {
    event?: {
      clearInstanceListeners: (instance: unknown) => void;
    };
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        options: {
          fields: string[];
          types: string[];
        },
      ) => GoogleAutocomplete;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    __hostbidGoogleMapsReady?: () => void;
  }
}

let googleMapsPromise: Promise<void> | null = null;

function getGoogleMapsApiKey() {
  return (
    window.__HOSTBID_ENV__?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    ""
  );
}

function loadGoogleMapsPlaces() {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const apiKey = getGoogleMapsApiKey().trim();

    if (!apiKey) {
      reject(new Error("Google Maps is not configured."));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-hostbid-google-maps]");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps could not load.")), { once: true });
      return;
    }

    window.__hostbidGoogleMapsReady = () => {
      if (window.google?.maps?.places) {
        resolve();
      } else {
        reject(new Error("Google Places is not available for this API key."));
      }
    };

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.hostbidGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__hostbidGoogleMapsReady`;
    script.onerror = () => reject(new Error("Google Maps could not load."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function getAddressComponent(components: GoogleAddressComponent[] | undefined, types: string[]) {
  return components?.find((component) => types.some((type) => component.types.includes(type)))?.long_name ?? null;
}

function parseStructuredAddress(components: GoogleAddressComponent[] | undefined) {
  return {
    city: getAddressComponent(components, [
      "locality",
      "postal_town",
      "administrative_area_level_3",
      "administrative_area_level_2",
    ]),
    province: getAddressComponent(components, ["administrative_area_level_1"]),
    country: getAddressComponent(components, ["country"]),
  };
}

export function GooglePlacesField({
  label,
  placeholder,
  value,
  placeId,
  latitude,
  longitude,
  required = false,
  onChange,
}: GooglePlacesFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let listener: { remove: () => void } | null = null;

    async function setupAutocomplete() {
      try {
        await loadGoogleMapsPlaces();

        if (cancelled || !inputRef.current || !window.google?.maps?.places) {
          return;
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
          types: ["address"],
        });
        listener = autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          const selectedPlaceId = place?.place_id ?? "";
          const address = place?.formatted_address ?? place?.name ?? inputRef.current?.value ?? "";
          const location = place?.geometry?.location;

          if (!selectedPlaceId) {
            onChangeRef.current({
              address,
              placeId: "",
              latitude: null,
              longitude: null,
              city: null,
              province: null,
              country: null,
            });
            return;
          }

          const structuredAddress = parseStructuredAddress(place?.address_components);

          onChangeRef.current({
            address,
            placeId: selectedPlaceId,
            latitude: location ? location.lat() : null,
            longitude: location ? location.lng() : null,
            ...structuredAddress,
          });
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Google Maps could not load.");
        }
      }
    }

    void setupAutocomplete();

    return () => {
      cancelled = true;
      listener?.remove();
      if (autocompleteRef.current) {
        window.google?.maps.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const hasSelectedPlace = Boolean(value && placeId);
  const mapUrl =
    hasSelectedPlace && typeof latitude === "number" && typeof longitude === "number"
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=15&output=embed`
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-900">{label}</label>
        <Badge tone={hasSelectedPlace ? "success" : "default"}>
          <MapPin className="h-3.5 w-3.5" />
          {hasSelectedPlace ? "Google verified" : "Place required"}
        </Badge>
      </div>
      <Input
        ref={inputRef}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        required={required}
        disabled={Boolean(loadError)}
        onChange={(event) =>
          onChange({
            address: event.target.value,
            placeId: "",
            latitude: null,
            longitude: null,
            city: null,
            province: null,
            country: null,
          })
        }
      />
      {loadError ? (
        <p className="text-sm text-red-600">{loadError} Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable address entry.</p>
      ) : value && !placeId ? (
        <p className="text-sm text-red-600">Choose an address from the Google suggestions before saving.</p>
      ) : null}
      {mapUrl ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <iframe
            title={`${label} map`}
            src={mapUrl}
            className="h-48 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  );
}
