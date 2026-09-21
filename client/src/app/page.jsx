import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import LatestReports from '@/components/home/LatestReports';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

export default function HomePage() {
  return (
    <div className={cn('flex w-full flex-col gap-12 py-8 md:py-14', PAGE_PADDING)}>
      <HeroSection />
      <CategoryGrid />
      <LatestReports />
    </div>
  );
}