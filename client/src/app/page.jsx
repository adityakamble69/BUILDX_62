import ApiStatus from '@/components/layout/ApiStatus';

// Placeholder landing page for Phase 1. Replaced in Phase 6.
export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col justify-center gap-8 px-4 py-12 md:px-6">
      <div className="max-w-xl">
        <h1 className="text-[28px] font-bold leading-9 md:text-[32px] md:leading-10">
          Report. Prioritize. Resolve.
        </h1>
        <p className="mt-3 text-ink-muted">
          Civic Fix is being built. The skeleton is live; reporting and the public map come next.
        </p>
      </div>
      <div className="max-w-xl">
        <ApiStatus />
      </div>
    </div>
  );
}
