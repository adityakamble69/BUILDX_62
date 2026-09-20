'use client';

import { useState } from 'react';
import { Inbox } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import Skeleton, { ReportCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ReportCard from '@/components/report/ReportCard';
import Sidebar from '@/components/layout/Sidebar';
import DynamicMapView from '@/components/map/DynamicMapView';
import { useToast } from '@/lib/context/ToastContext';

const CATEGORY_OPTIONS = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'water_leak', label: 'Water Leak' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'other', label: 'Other' },
];

const SAMPLE_REPORTS = [
  {
    id: '1',
    title: 'Large pothole on MG Road',
    status: 'reported',
    category: 'pothole',
    areaName: 'MG Road, Ward 5',
    upvoteCount: 23,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    thumbnailUrl: '/demo/pothole.jpg',
    lat: 21.1498,
    lng: 79.0882,
  },
  {
    id: '2',
    title: 'Overflowing garbage bin',
    status: 'in_progress',
    category: 'garbage',
    areaName: 'Near Central Park',
    upvoteCount: 45,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    thumbnailUrl: '/demo/garbage.jpg',
    lat: 21.1408,
    lng: 79.0812,
  },
  {
    id: '3',
    title: 'Streetlight not working',
    status: 'resolved',
    category: 'streetlight',
    areaName: 'Main Street, Ward 3',
    upvoteCount: 78,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    thumbnailUrl: '/demo/streetlight.jpg',
    lat: 21.1528,
    lng: 79.0932,
  },
  {
    id: '4',
    title: 'Water leakage near Lake View Road',
    status: 'rejected',
    category: 'water_leak',
    areaName: 'Lake View Road',
    upvoteCount: 12,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    thumbnailUrl: '/demo/water-leak.jpg',
    lat: 21.1378,
    lng: 79.0862,
  },
];

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 py-12 md:px-6">
      <div>
        <h1>Civic Fix — Style Guide</h1>
        <p className="mt-2 text-ink-muted">
          Temporary Phase 3 reference. Every token, component and layout piece here comes from{' '}
          <code>docs/design.md</code> — remove this page once the real pages exist (Phase 6+).
        </p>
      </div>

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            ['primary-600', 'bg-primary-600'],
            ['secondary-600', 'bg-secondary-600'],
            ['accent-500', 'bg-accent-500'],
            ['success', 'bg-success'],
            ['warning', 'bg-warning'],
            ['danger', 'bg-danger'],
            ['info', 'bg-info'],
            ['status-reported', 'bg-status-reported'],
            ['status-progress', 'bg-status-progress'],
            ['status-resolved', 'bg-status-resolved'],
            ['status-rejected', 'bg-status-rejected'],
          ].map(([name, className]) => (
            <div key={name} className="overflow-hidden rounded-lg border border-border">
              <div className={`h-16 ${className}`} />
              <p className="p-2 text-xs font-medium">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          <p className="text-[36px] font-bold leading-[44px] md:text-[48px] md:leading-[56px]">Display</p>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <p>Body text — DM Sans, 16/24.</p>
          <p className="text-sm">Body small — 14/20.</p>
          <p className="text-xs text-ink-subtle">Caption — 12/16.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status="reported" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="resolved" />
          <StatusBadge status="rejected" />
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="neutral">Neutral</Badge>
        </div>
      </Section>

      <Section title="Form fields">
        <Card className="max-w-md">
          <div className="flex flex-col gap-4">
            <Input label="Title" placeholder="E.g. Pothole on main road" required />
            <Select label="Category" placeholder="Select category" options={CATEGORY_OPTIONS} required />
            <Textarea
              label="Description"
              placeholder="Describe the issue in detail…"
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Input label="With an error" defaultValue="ab" error="Title must be at least 5 characters" required />
          </div>
        </Card>
      </Section>

      <Section title="Cards & ReportCard">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_REPORTS.map((r) => (
            <ReportCard key={r.id} {...r} />
          ))}
        </div>
      </Section>

      <Section title="Skeletons (loading state)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCardSkeleton />
          <ReportCardSkeleton />
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-5/6" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
          <Skeleton variant="circle" width="48px" height="48px" />
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Inbox}
          title="No reports yet"
          description="Be the first to report an issue in your area."
          actionLabel="Report an Issue"
          onAction={() => toast('This would open the report form.', 'info')}
        />
      </Section>

      <Section title="Modal & Toasts">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => toast('Report submitted successfully.', 'success')}>
            Show success toast
          </Button>
          <Button variant="secondary" onClick={() => toast('Could not reach the server.', 'danger')}>
            Show error toast
          </Button>
          <Button variant="secondary" onClick={() => toast('The server is waking up, hang tight…', 'warning')}>
            Show warning toast
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Confirm action"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setModalOpen(false);
                  toast('Report rejected.', 'danger');
                }}
              >
                Reject report
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-muted">
            This is a modal dialog. It traps focus, closes on Esc or overlay click, and returns focus
            to the trigger button on close.
          </p>
        </Modal>
      </Section>

      <Section title="Map (browse mode)">
        <DynamicMapView reports={SAMPLE_REPORTS} className="h-[400px]" />
      </Section>

      <Section title="Admin sidebar">
        <Card padding="none" className="h-[420px] overflow-hidden">
          <Sidebar adminName="Admin" />
        </Card>
      </Section>
    </div>
  );
}
