'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { getCategories, getReportsMap, listReports } from '@/lib/api';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { CATEGORY_LABELS } from '@/lib/utils/categories';
import { STATUS_META } from '@/components/ui/StatusBadge';
import DynamicMapView from '@/components/map/DynamicMapView';
import MapReportListItem from '@/components/map/MapReportListItem';
import MapFiltersPanel from '@/components/map/MapFiltersPanel';
import { ReportCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'upvotes', label: 'Sort: Most upvoted' },
];

const LIST_PAGE_SIZE = 50;

export default function MapPage() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [area, setArea] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  // Area options derived from the loaded page of reports — no dedicated endpoint for a
  // unique area list, and the mockup's dropdown is fine with "areas visible right now".
  const areaOptions = useMemo(() => {
    if (!reports) return [];
    const set = new Set();
    reports.forEach((r) => r.area_name && set.add(r.area_name));
    return Array.from(set).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return null;
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (area && r.area_name !== area) return false;
      if (!q) return true;
      // Client-side search only — narrows the already-loaded list; the reports list
      // endpoint has no full-text param yet.
      return (
        r.title.toLowerCase().includes(q) || r.area_name?.toLowerCase().includes(q)
      );
    });
  }, [reports, search, area]);

  const hasActiveFilters = category || status || area || sort !== 'newest' || search;

  function clearFilters() {
    setCategory('');
    setStatus('');
    setArea('');
    setSort('newest');
    setSearch('');
  }

  const filtersPanelProps = {
    category,
    status,
    area,
    areaOptions,
    onCategoryChange: setCategory,
    onStatusChange: setStatus,
    onAreaChange: setArea,
    onClearAll: clearFilters,
    hasActiveFilters: !!hasActiveFilters,
  };

  return (
    <div className={cn('flex w-full flex-col gap-5 py-6 md:py-8', PAGE_PADDING)}>
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">City Map</h1>
        <p className="mt-1 text-ink-muted">Explore and track civic issues in your area.</p>
      </div>

      {/* Top bar — search + sort (always) + Filters button (mobile only) */}
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

        <div className="hidden w-44 sm:block">
          <Select
            label="Sort"
            hideLabel
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>

        {/* Mobile Filters trigger — panel itself is hidden below lg */}
        <Button
          variant="secondary"
          size="md"
          className="lg:hidden"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="md"
            onClick={clearFilters}
            className="hidden text-ink-muted sm:inline-flex"
          >
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_340px]">
          {/* Left rail — desktop only; rendered inside a drawer on mobile */}
          <div className="hidden lg:block">
            <MapFiltersPanel {...filtersPanelProps} />
          </div>

          {/* Map */}
          <div className="min-w-0">
            <DynamicMapView
              reports={enrichedPoints ?? []}
              center={focused ? [focused.lat, focused.lng] : undefined}
              zoom={focused ? 16 : undefined}
              onMarkerClick={(id) => router.push(`/reports/${id}`)}
              className="h-[520px] lg:h-[calc(100vh-240px)] lg:min-h-[560px]"
            />
          </div>

          {/* Right rail — recent reports */}
          <div className="flex flex-col gap-3 lg:max-h-[calc(100vh-240px)]">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink">Recent Reports</h2>
              <button
                type="button"
                onClick={() => router.push('/reports')}
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                View all →
              </button>
            </div>

            <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              {filteredReports === null &&
                Array.from({ length: 5 }).map((_, i) => <ReportCardSkeleton key={i} />)}

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
        </div>
      )}

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[rgba(15,23,42,0.5)]"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] overflow-y-auto bg-bg p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="rounded p-1 text-ink-muted hover:bg-bg"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <MapFiltersPanel {...filtersPanelProps} />
          </div>
        </div>
      )}
    </div>
  );
}