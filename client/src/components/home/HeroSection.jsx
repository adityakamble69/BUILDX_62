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

/**
 * Static hero + feature cards, matching the uploaded landing mockup: photo-style city
 * backdrop with a dark left-to-right gradient for text contrast, a value-prop card
 * floating on the right (large screens), and 4 feature cards below.
 *
 * The backdrop is a decorative SVG rather than a licensed photograph — replace the
 * <svg> block with a next/image (with the image host added to next.config's
 * `images.remotePatterns`) if a real hero photo is preferred.
 */
export default function HeroSection() {
  return (
    <section>
      <div className="relative min-h-[440px] overflow-hidden rounded-2xl bg-secondary-600 md:min-h-[520px]">
        {/* Decorative city backdrop — sky → buildings → green foreground, then a
            left-to-right dark overlay so the white headline stays readable on any
            part of the illustration. */}
        <svg
          viewBox="0 0 1200 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="55%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
            <linearGradient id="heroOverlay" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.94" />
              <stop offset="45%" stopColor="#1E293B" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#1E293B" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <rect width="1200" height="500" fill="url(#heroSky)" />

          {/* Building skyline — mid-tone slate with slight variation. */}
          {[
            [20, 220, 70, 280, '#64748B'],
            [100, 180, 55, 320, '#475569'],
            [165, 250, 80, 250, '#94A3B8'],
            [260, 140, 65, 360, '#475569'],
            [335, 200, 90, 300, '#64748B'],
            [440, 100, 75, 400, '#334155'],
            [530, 170, 60, 330, '#64748B'],
            [600, 130, 85, 370, '#475569'],
            [700, 210, 70, 290, '#94A3B8'],
            [780, 160, 100, 340, '#475569'],
            [895, 240, 60, 260, '#64748B'],
            [965, 120, 90, 380, '#334155'],
            [1070, 200, 75, 300, '#64748B'],
            [1160, 170, 60, 330, '#475569'],
          ].map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
          ))}

          {/* Park / tree line in the foreground. */}
          <rect y="420" width="1200" height="80" fill="#166534" opacity="0.85" />
          {Array.from({ length: 20 }).map((_, i) => (
            <circle key={i} cx={i * 62 + 30} cy={420} r={26 + ((i * 7) % 14)} fill="#14532D" />
          ))}

          {/* Readability overlay. */}
          <rect width="1200" height="500" fill="url(#heroOverlay)" />
        </svg>

        {/* Content */}
        <div className="relative flex min-h-[440px] max-w-3xl flex-col justify-center gap-5 px-6 py-14 md:min-h-[520px] md:px-12 md:py-20">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
            Cleaner streets · Safer communities · A better tomorrow
          </div>

          <h1 className="text-4xl font-bold leading-[1.05] text-white md:text-[56px]">
            Fix Your City.
            <br />
            One Report at a Time.
          </h1>

          <p className="max-w-xl text-base text-white/85 md:text-lg">
            Report civic issues like potholes, garbage, broken streetlights, water leaks and
            more. Help make your city cleaner, safer and better for everyone.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button as="a" href="/report/new" size="lg">
              Report an issue
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

        {/* Floating value-prop card on large screens (mockup). */}
        <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="w-64 rounded-2xl border border-white/40 bg-surface/95 p-5 shadow-lg backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-5 text-ink">Cleaner streets.</p>
                <p className="text-sm font-semibold leading-5 text-ink">Stronger communities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-ink">{title}</p>
            <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}