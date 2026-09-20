import Card from '@/components/ui/Card';

/**
 * design.md §15 `ChartCard` / §10 "no chart without a title". A fixed height keeps
 * Chart.js's `maintainAspectRatio: false` canvases from collapsing to 0px.
 * @param {{ title: string, children: React.ReactNode, height?: number }} props
 */
export default function ChartCard({ title, children, height = 280 }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-4" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}
