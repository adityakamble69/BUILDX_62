import HeroSection from '@/components/home/HeroSection';
import StatsStrip from '@/components/home/StatsStrip';
import CategoryGrid from '@/components/home/CategoryGrid';
import LatestReports from '@/components/home/LatestReports';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

export default function HomePage() {
  return (
    <div className={cn('flex w-full flex-col gap-10 py-8 md:py-12', PAGE_PADDING)}>
      <HeroSection />
      <StatsStrip />
      <CategoryGrid />
      <LatestReports />
    </div>
  );
}
