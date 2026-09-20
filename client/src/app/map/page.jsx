'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { getCategories, getReportsMap, listReports } from '@/lib/api';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { CATEGORY_LABELS } from '@/lib/utils/categories';
import { STATUS_META } from '@/components/ui/StatusBadge';
import DynamicMapView from '@/components/map/DynamicMapView';
import MapReportListItem from '@/components/map/MapReportListItem';
import { ReportCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

// `/reports/map` always excludes rejected reports (sql/002_functions.sql), so offering
// it here would silently empty the map while the sidebar list still showed results.
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  ...Object.entries(STATUS_META)
    .filter(([value]) => value !== 'rejected')
    .map(([value, meta]) => ({ value, label: meta.label })),
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'upvotes', label: 'Sort: Most upvoted' },
];

const LIST_PAGE_SIZE = 50;

export default function MapPage() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');

  const [categoriesById, setCategoriesById] = useState({});
  const [mapPoints, setMapPoints] = useState(null);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(false);
  const [focused, setFocused] = useState(null); // { id, lat, lng }

  // Categories rarely change — fetch once to resolve `/reports/map`'s numeric
  // `category_id` back to a slug/label for the marker popups.
  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then((res) => {
        const byId = Object.fromEntries(res.data.map((c) => [c.id, c]));
        setCategoriesById(byId);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    setFocused(null);

    const filters = { category: category || undefined, status: status || undefined };

    Promise.all([
      getReportsMap(filters, controller.signal),
      listReports({ ...filters, sort, pageSize: LIST_PAGE_SIZE }, controller.signal),
    ])
      .then(([mapRes, listRes]) => {
        setMapPoints(mapRes.data);
        setReports(listRes.data);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(true);
      });

    return () => controller.abort();
  }, [category, status, sort]);

  // The list fetch (up to 50 rows) carries the rich fields the lightweight map points
  // don't (thumbnail, area, timestamp) — merge them in by id for nicer popups. Markers
  // beyond the first 50 (by the same sort) fall back to a bare popup.
  const enrichedPoints = useMemo(() => {
    if (!mapPoints) return null;
    const byId = new Map((reports ?? []).map((r) => [r.id, r]));
    return mapPoints.map((p) => {
      const rich = byId.get(p.id);
      return {
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        status: p.status,
        title: p.title,
        upvoteCount: rich?.upvote_count ?? p.upvote_count,
        categoryLabel: rich?.category?.name ?? categoriesById[p.category_id]?.name,
        areaName: rich?.area_name,
        createdAt: rich?.created_at,
        thumbnailUrl: getThumbnailUrl(rich?.images),
      };
    });
  }, [mapPoints, reports, categoriesById]);

  const filteredReports = useMemo(() => {
    if (!reports) return null;
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    // Client-side only — narrows the already-loaded list, doesn't hit the API (the
    // reports list endpoint has no full-text search param yet).
    return reports.filter(
      (r) => r.title.toLowerCase().includes(q) || r.area_name?.toLowerCase().includes(q),
    );
  }, [reports, search]);

  const hasActiveFilters = category || status || sort !== 'newest' || search;

  function clearFilters() {
    setCategory('');
    setStatus('');
    setSort('newest');
    setSearch('');
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">City Map</h1>
        <p className="mt-1 text-ink-muted">Explore and track civic issues in your area.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Input
            label="Search"
            hideLabel
            placeholder="Search by location, category or issue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9"
          />
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
        </div>
        <div className="w-40">
          <Select
            label="Category"
            hideLabel
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            label="Status"
            hideLabel
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            label="Sort"
            hideLabel
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={clearFilters} className="text-ink-muted">
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>

      {error ? (
        <EmptyState
          title="Couldn't load the map"
          description="The server may still be waking up — refresh in a few seconds."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DynamicMapView
              reports={enrichedPoints ?? []}
              center={focused ? [focused.lat, focused.lng] : undefined}
              zoom={focused ? 16 : undefined}
              onMarkerClick={(id) => router.push(`/reports/${id}`)}
              className="h-[70vh]"
            />
          </div>

          <div className="flex flex-col gap-2 lg:col-span-1 lg:max-h-[70vh] lg:overflow-y-auto">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink-muted">
                {filteredReports ? `${filteredReports.length} reports` : 'Reports'}
              </h2>
            </div>

            {filteredReports === null &&
              Array.from({ length: 4 }).map((_, i) => <ReportCardSkeleton key={i} />)}

            {filteredReports?.length === 0 && (
              <EmptyState
                title="No reports match these filters"
                description="Try a different category, status, or search term."
                actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            )}

            {filteredReports?.map((r) => (
              <MapReportListItem
                key={r.id}
                id={r.id}
                title={r.title}
                status={r.status}
                category={r.category?.slug}
                areaName={r.area_name}
                upvoteCount={r.upvote_count}
                createdAt={r.created_at}
                thumbnailUrl={getThumbnailUrl(r.images)}
                active={focused?.id === r.id}
                onFocus={() => setFocused({ id: r.id, lat: r.lat, lng: r.lng })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
