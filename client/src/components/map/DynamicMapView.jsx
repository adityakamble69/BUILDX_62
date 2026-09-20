'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';

// Loading skeleton can't see the caller's className (next/dynamic's `loading` has no props),
// so it uses a mid-sized default; the real map still ends up at whatever height the caller passed.
const LazyMapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

/** Import this component (not MapView directly) from any page/section that renders a map. */
export default function DynamicMapView({ className = 'h-[70vh]', ...props }) {
  return <LazyMapView className={className} {...props} />;
}
