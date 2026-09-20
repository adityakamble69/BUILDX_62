'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { timeAgo } from '@/lib/utils/timeAgo';

// design.md §2 — same hex values as the status badges and the Tailwind `status.*` tokens.
const STATUS_COLORS = {
  reported: '#F59E0B',
  in_progress: '#2563EB',
  resolved: '#16A34A',
  rejected: '#6B7280',
};

// Default map center: Nagpur (matches server/sql/003_seed.sql demo data).
const DEFAULT_CENTER = [21.1458, 79.0882];
const DEFAULT_ZOOM = 13;

/** Circular div-icon pin, colored by status and sized slightly by upvotes (design.md §9, max 1.5x). */
function buildIcon(status, upvoteCount = 0) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.reported;
  const scale = Math.min(1.5, 1 + Math.min(upvoteCount, 50) / 100);
  const size = Math.round(22 * scale);

  return L.divIcon({
    className: '',
    html: `<span style="
      display:block;width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(15,23,42,.35);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Recenters the map imperatively when `center`/`zoom` props change after mount. */
function FlyToCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

/** Teardrop pin (accent-500) used only in `pick-location` mode, to read as "not yet a report". */
function buildPickIcon() {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:block;width:28px;height:28px;transform:rotate(45deg);
      border-radius:9999px 9999px 9999px 0;
      background:#F59E0B;border:2px solid white;box-shadow:0 1px 4px rgba(15,23,42,.35);
    "></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

/** Click-to-place / drag-to-adjust pin for `pick-location` mode. */
function LocationPicker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!value) return null;
  return (
    <Marker
      position={[value.lat, value.lng]}
      icon={buildPickIcon()}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onChange(lat, lng);
        },
      }}
    />
  );
}

/** Floating "use my location" button, only rendered in `pick-location` mode. */
function LocateMeControl({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  function handleClick() {
    if (!navigator.geolocation) {
      setUnsupported(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocate(latitude, longitude);
        map.setView([latitude, longitude], 16);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={locating || unsupported}
      className="absolute bottom-3 right-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-md hover:text-primary-600 disabled:opacity-50"
      aria-label="Use my current location"
      title={unsupported ? 'Location is not available on this device' : 'Use my current location'}
    >
      <LocateFixed className={locating ? 'h-5 w-5 animate-pulse' : 'h-5 w-5'} aria-hidden="true" />
    </button>
  );
}

/**
 * Two modes (architecture.md §5): `browse` (default) shows status-colored report markers
 * with popups; `pick-location` shows a single draggable pin plus a locate-me control, for
 * the report form's location step. (`heat` is a future admin-panel mode, Phase 7.)
 *
 * @param {{
 *  reports?: Array<{
 *    id: string, lat: number, lng: number, status: string, title: string,
 *    categoryLabel?: string, areaName?: string, upvoteCount?: number,
 *    thumbnailUrl?: string, createdAt?: string,
 *  }>,
 *  center?: [number, number],
 *  zoom?: number,
 *  onMarkerClick?: (reportId: string) => void, // browse mode: fired by the popup's "View details" link, not the marker itself
 *  className?: string,
 *  mode?: 'browse' | 'pick-location',
 *  value?: { lat: number, lng: number } | null, // pick-location mode only
 *  onChange?: (lat: number, lng: number) => void, // pick-location mode only
 * }} props
 */
export default function MapView({
  reports = [],
  center,
  zoom,
  onMarkerClick,
  className = 'h-[70vh]',
  mode = 'browse',
  value,
  onChange,
}) {
  const isPicker = mode === 'pick-location';

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border ${className}`}>
      <MapContainer
        center={center ?? (isPicker && value ? [value.lat, value.lng] : DEFAULT_CENTER)}
        zoom={zoom ?? (isPicker && value ? 16 : DEFAULT_ZOOM)}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToCenter center={center} zoom={zoom} />

        {isPicker ? (
          <LocationPicker value={value} onChange={onChange} />
        ) : (
          reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={buildIcon(report.status, report.upvoteCount)}
            >
              <Popup minWidth={220}>
                <div className="flex flex-col gap-2">
                  {report.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- Leaflet popups render outside the Next.js tree.
                    <img
                      src={report.thumbnailUrl}
                      alt=""
                      className="aspect-video w-full rounded object-cover"
                    />
                  )}
                  <StatusBadge status={report.status} className="w-fit" />
                  <p className="text-sm font-semibold text-ink">{report.title}</p>
                  <p className="text-xs text-ink-muted">
                    {[report.categoryLabel, report.areaName].filter(Boolean).join(' · ')}
                  </p>
                  <div className="flex items-center justify-between text-xs text-ink-subtle">
                    <span>
                      {report.upvoteCount ?? 0} upvote{report.upvoteCount === 1 ? '' : 's'}
                    </span>
                    {report.createdAt && <span>{timeAgo(report.createdAt)}</span>}
                  </div>
                  {onMarkerClick && (
                    <button
                      type="button"
                      onClick={() => onMarkerClick(report.id)}
                      className="mt-1 text-left text-xs font-semibold text-primary-600 hover:underline"
                    >
                      View details →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>

      {isPicker && onChange && <LocateMeControl onLocate={onChange} />}
    </div>
  );
}
