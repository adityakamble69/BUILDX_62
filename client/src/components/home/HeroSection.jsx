import Link from 'next/link';
import { Camera, Users, LineChart, Building2, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';

const FEATURES = [
  {
    icon: Camera,
    title: 'Report An Issue',
    description: 'Snap a photo, add details and mark the location.',
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Upvote important issues and bring them to the top.',
  },
  {
    icon: LineChart,
    title: 'Track Progress',
    description: 'See real-time updates on your reports.',
  },
  {
    icon: Building2,
    title: 'Better Cities',
    description: 'Together we can build cleaner, safer cities.',
  },
];

// Static shell — no state or effects, so this stays a server component
// (architecture.md §"Server vs client components").
export default function HeroSection() {
  return (
    <section>
      <div className="relative overflow-hidden rounded-lg bg-secondary-600">
        {/* Decorative skyline silhouette instead of a stock photo — keeps the bundle
            self-contained and avoids licensing a real city photograph. */}
        <svg
          viewBox="0 0 1200 400"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-40"
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          <rect width="1200" height="400" fill="url(#sky)" />
          {[
            [40, 210, 70, 190],
            [130, 160, 90, 240],
            [240, 230, 60, 170],
            [320, 120, 110, 280],
            [460, 190, 80, 210],
            [560, 90, 130, 310],
            [720, 200, 75, 200],
            [820, 150, 100, 250],
            [950, 220, 65, 180],
            [1040, 110, 120, 290],
            [1150, 200, 70, 200],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="#0B4A44" opacity="0.6" />
          ))}
        </svg>

        <div className="relative flex flex-col gap-6 px-6 py-14 md:px-12 md:py-20">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            Cleaner streets · Safer communities · A better tomorrow
          </div>

          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white md:text-[52px] md:leading-[1.05]">
            Fix Your City.
            <br />
            One Report at a Time.
          </h1>

          <p className="max-w-xl text-base text-white/80 md:text-lg">
            Report potholes, garbage, streetlights, water leaks and other civic issues.
            Help make your city cleaner, safer and better for everyone.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button as="a" href="/report/new" size="lg">
              Report an Issue
            </Button>
            <Button
              as="a"
              href="/map"
              variant="secondary"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Explore Map
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-600">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
