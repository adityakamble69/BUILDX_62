'use client';

import { useEffect, useState } from 'react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import DynamicMapView from '@/components/map/DynamicMapView';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

/**
 * `/admin/heatmap` — density view of open reports (phases.md Phase 7). `GET /admin/heatmap`
 * → `get_heatmap_points()` (sql/005_phase7.sql), which weights each point by severity so a
 * cluster of severity-5 reports reads hotter than the same count of severity-1 ones.
 */
export default function AdminHeatmapPage() {
  const { request, isLoaded } = useApi();
  const [points, setPoints] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(authPaths.adminHeatmap)
      .then((res) => {
        if (active) setPoints(res.data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, request]);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Heatmap</h1>
        <p className="mt-1 text-ink-muted">
          Where issues concentrate across the city — teal is light, red is heavy.
        </p>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load the heatmap"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && points === null && <Skeleton className="h-[70vh] w-full" />}

      {!error && points?.length === 0 && (
        <EmptyState title="No open reports yet" description="The heatmap fills in as reports come in." />
      )}

      {!error && points?.length > 0 && <DynamicMapView mode="heat" heatPoints={points} />}
    </div>
  );
}
