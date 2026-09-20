'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import Input from '@/components/ui/Input';
import DynamicMapView from '@/components/map/DynamicMapView';
import { reverseGeocode } from '@/lib/utils/geocode';

// Nominatim's usage policy asks for a low request rate, so the pin has to settle before
// we ask (geocode.js says the caller owns this half of the policy).
const GEOCODE_DEBOUNCE_MS = 800;

/**
 * Step 2 — location. Uses `MapView`'s existing `pick-location` mode (Phase 3): click to
 * place, drag to adjust, plus its built-in "use my location" control. The area name is
 * reverse-geocoded as a *suggestion* — it stays editable, because Nominatim often returns
 * a road name where the user would rather write the locality.
 *
 * @param {{
 *  value: { lat: number, lng: number } | null,
 *  onChange: (value: { lat: number, lng: number }) => void,
 *  areaName: string,
 *  onAreaNameChange: (value: string) => void,
 * }} props
 */
export default function LocationStep({ value, onChange, areaName, onAreaNameChange }) {
  const [geocoding, setGeocoding] = useState(false);
  // Tracks whether the user has typed their own area name; once they have, a later pin
  // nudge must not overwrite it.
  const edited = useRef(false);

  useEffect(() => {
    if (!value || edited.current) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setGeocoding(true);
      try {
        const name = await reverseGeocode(value.lat, value.lng, controller.signal);
        if (name && !edited.current) onAreaNameChange(name);
      } catch {
        // Fail soft: the field is optional and the user can type it themselves.
      } finally {
        setGeocoding(false);
      }
    }, GEOCODE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, onAreaNameChange]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Pin the location</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Tap the map where the issue is, or use the locate button to drop a pin at your current
          position. Drag the pin to fine-tune it.
        </p>
      </div>

      <DynamicMapView
        className="h-[320px]"
        mode="pick-location"
        value={value}
        onChange={(lat, lng) => onChange({ lat, lng })}
      />

      {value ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      ) : (
        <p className="text-sm text-ink-subtle">No location selected yet.</p>
      )}

      <Input
        label="Area name"
        placeholder="E.g. MG Road, Ward 5"
        maxLength={200}
        value={areaName}
        helperText={geocoding ? 'Looking up this area…' : 'Filled in automatically — edit it if it looks wrong.'}
        onChange={(e) => {
          edited.current = true;
          onAreaNameChange(e.target.value);
        }}
      />
    </div>
  );
}
