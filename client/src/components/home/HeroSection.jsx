import Image from 'next/image';
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
 * Landing Hero Section featuring the city skyline background photo with high-contrast
 * readable typography, primary and secondary CTA buttons, and a floating value-prop card.
 */
export default function HeroSection() {
  return (
    <section>
      {/* City Hero Banner with clean city photo background */}
      <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-border/60 bg-slate-100 shadow-sm md:min-h-[500px] lg:min-h-[520px]">
        {/* Real city skyline photo */}
        <Image
          src="/images/hero-bg.png"
          alt="Civic Fix City Skyline"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1400px"
          className="object-cover object-right md:object-center"
        />

        {/* Soft gradient overlay on left for optimal text contrast across all viewports */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/85 to-surface/20 md:via-surface/75 md:to-transparent" />

        {/* Foreground Content */}
        <div className="relative flex min-h-[460px] max-w-2xl flex-col justify-center gap-5 px-6 py-12 sm:px-10 md:min-h-[500px] md:px-12 md:py-16 lg:min-h-[520px]">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-600/20 bg-primary-50/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 backdrop-blur-sm">
            Cleaner streets · Safer communities · A better tomorrow
          </div>

          <h1 className="font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[54px]">
            <span className="text-primary-600">Fix Your City.</span>
            <br />
            <span className="text-secondary-600">One Report at a Time.</span>
          </h1>

          <p className="max-w-xl text-base font-normal leading-relaxed text-ink-muted md:text-lg">
            Report civic issues like potholes, garbage, broken streetlights, water leaks and
            more. Help make your city cleaner, safer and better for everyone.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button as="a" href="/report/new" variant="primary" size="lg" className="shadow-md hover:shadow-lg">
              Report an Issue →
            </Button>
            <Button
              as="a"
              href="/map"
              variant="secondary"
              size="lg"
              className="border-border bg-surface/90 text-ink shadow-sm backdrop-blur-sm hover:bg-surface hover:border-primary-600/40"
            >
              <MapPin className="h-4 w-4 text-primary-600" aria-hidden="true" />
              Explore Map
            </Button>
          </div>
        </div>

        {/* Floating value-prop badge on desktop */}
        <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="w-64 rounded-2xl border border-white/80 bg-surface/95 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-snug text-ink">Cleaner streets.</p>
                <p className="text-sm font-semibold leading-snug text-ink-muted">Stronger communities.</p>
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