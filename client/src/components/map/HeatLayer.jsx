'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// design.md §9 — teal → amber → red (low → high density). leaflet.heat keys are 0–1.
const GRADIENT = {
  0.2: '#0F766E',
  0.5: '#F59E0B',
  1.0: '#DC2626',
};

/**
 * Leaflet heat overlay for admin `/admin/heatmap`. Must live inside a MapContainer
 * (MapView `mode="heat"`). Intensity uses report severity (1–5) so hotter spots
 * are both denser *and* more severe.
 *
 * @param {{ points?: Array<{ lat: number, lng: number, severity?: number }> }} props
 *   Rows from `GET /admin/heatmap` (`get_heatmap_points`).
 */
export default function HeatLayer({ points = [] }) {
  const map = useMap();

  useEffect(() => {
    const latlngs = points
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => [p.lat, p.lng, Math.max(0.2, (p.severity ?? 3) / 5)]);

    const layer = L.heatLayer(latlngs, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
      minOpacity: latlngs.length ? 0.35 : 0,
      gradient: GRADIENT,
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
