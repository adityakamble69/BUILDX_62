import { MapPin, Users, ShieldCheck, Zap, Github, Heart } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';
import Button from '@/components/ui/Button';

export const metadata = {
  title: 'About — Civic Fix',
  description: 'Learn about Civic Fix — the citizen-powered platform for reporting and resolving city problems.',
};

const FEATURES = [
  {
    icon: MapPin,
    title: 'Map-First Reporting',
    description:
      'Pin any city issue on an interactive map. Every report is geo-tagged so the right department knows exactly where to go.',
  },
  {
    icon: Users,
    title: 'Community Prioritization',
    description:
      'Citizens upvote the most critical issues. Admins see what the community cares about most — no more guessing.',
  },
  {
    icon: ShieldCheck,
    title: 'Full Transparency',
    description:
      'Every status change is logged. Citizens receive in-app notifications when their issue moves from "Reported" to "Resolved".',
  },
  {
    icon: Zap,
    title: 'AI-Assisted Reporting',
    description:
      'Upload a photo and our AI suggests the right category and severity — making it faster to file an accurate report.',
  },
];

const TECH_STACK = [
  { name: 'Next.js 15', role: 'Frontend' },
  { name: 'Express.js', role: 'API Server' },
  { name: 'Supabase + PostGIS', role: 'Database & Storage' },
  { name: 'Clerk', role: 'Authentication' },
  { name: 'Leaflet + OpenStreetMap', role: 'Maps' },
  { name: 'Tailwind CSS', role: 'Styling' },
  { name: 'Chart.js', role: 'Analytics' },
  { name: 'Google Gemini', role: 'AI Classification' },
];

const TEAM = [
  { name: 'Aditya Kamble', role: 'Full Stack Developer' },
  { name: 'Mohit Shivankar', role: 'Android Developer' },
];

export default function AboutPage() {
  return (
    <div className={cn('flex w-full flex-col gap-16 py-10 md:py-16', PAGE_PADDING)}>

      {/* Hero */}
      <section className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-primary-50 px-4 py-1.5 text-sm font-semibold text-primary-600">
          Built for BUILD-X Hackathon — A.C.E.S. Forum
        </span>
        <h1 className="font-heading text-4xl font-bold text-secondary-600 md:text-5xl">
          About Civic Fix
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Civic Fix is a citizen-powered platform that makes it easy to report city problems,
          track their resolution, and hold local authorities accountable — transparently and in real time.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/report/new">
            <Button variant="primary" size="md">Report an Issue</Button>
          </Link>
          <Link href="/map">
            <Button variant="secondary" size="md">Explore the Map</Button>
          </Link>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-3 font-heading text-xl font-semibold text-secondary-600">The Problem</h2>
          <ul className="space-y-2 text-ink-muted">
            <li className="flex gap-2"><span className="mt-1 text-danger">✗</span> Citizens don't know where or how to report civic issues.</li>
            <li className="flex gap-2"><span className="mt-1 text-danger">✗</span> Reports get lost in WhatsApp groups and email chains.</li>
            <li className="flex gap-2"><span className="mt-1 text-danger">✗</span> Authorities receive duplicate, unstructured, unprioritized complaints.</li>
            <li className="flex gap-2"><span className="mt-1 text-danger">✗</span> Citizens never find out if anything was actually done.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-primary-600/20 bg-primary-50 p-6 shadow-sm">
          <h2 className="mb-3 font-heading text-xl font-semibold text-primary-600">The Solution</h2>
          <ul className="space-y-2 text-ink-muted">
            <li className="flex gap-2"><span className="mt-1 text-success">✓</span> One platform for structured, geo-tagged reports with photos.</li>
            <li className="flex gap-2"><span className="mt-1 text-success">✓</span> Community upvotes surface the most urgent problems.</li>
            <li className="flex gap-2"><span className="mt-1 text-success">✓</span> Admin panel with assignment, status updates, and analytics.</li>
            <li className="flex gap-2"><span className="mt-1 text-success">✓</span> Automatic notifications close the loop with the citizen.</li>
          </ul>
        </div>
      </section>

      {/* Core Loop */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h2 className="font-heading text-2xl font-bold text-secondary-600">How It Works</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
          {['Report', 'Prioritize', 'Assign', 'Resolve', 'Notify'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-primary-600 px-4 py-2 text-white">{step}</span>
              {i < arr.length - 1 && <span className="text-ink-subtle">→</span>}
            </div>
          ))}
        </div>
        <p className="max-w-xl text-ink-muted">
          A citizen files a report with a photo and map pin. The community upvotes it. An admin assigns it to the right
          department, updates the status, and uploads a resolution photo. The citizen gets notified. Full circle.
        </p>
      </section>

      {/* Features */}
      <section className="flex flex-col gap-8">
        <h2 className="text-center font-heading text-2xl font-bold text-secondary-600">Key Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50">
                <Icon className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="font-heading text-base font-semibold text-secondary-600">{title}</h3>
              <p className="text-sm text-ink-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="flex flex-col gap-6">
        <h2 className="text-center font-heading text-2xl font-bold text-secondary-600">Tech Stack</h2>
        <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {TECH_STACK.map(({ name, role }) => (
            <div key={name} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-center shadow-sm">
              <span className="text-sm font-semibold text-secondary-600">{name}</span>
              <span className="text-xs text-ink-subtle">{role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="flex flex-col items-center gap-6">
        <h2 className="font-heading text-2xl font-bold text-secondary-600">Built By</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {TEAM.map(({ name, role }) => (
            <div key={name} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-8 py-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
                {name.charAt(0)}
              </div>
              <span className="font-semibold text-secondary-600">{name}</span>
              <span className="text-sm text-ink-muted">{role}</span>
            </div>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          Made with <Heart className="h-4 w-4 fill-danger text-danger" /> Silicon Brains Team
        </p>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-4 rounded-xl bg-secondary-600 px-6 py-10 text-center text-white">
        <h2 className="font-heading text-2xl font-bold">Ready to make your city better?</h2>
        <p className="max-w-md text-sm text-white/80">
          Join hundreds of citizens already reporting issues and holding authorities accountable.
        </p>
        <Link href="/report/new">
          <Button variant="accent" size="lg">Report an Issue Now</Button>
        </Link>
      </section>

    </div>
  );
}
