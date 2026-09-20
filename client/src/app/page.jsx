import HeroSection from '@/components/home/HeroSection';
import StatsStrip from '@/components/home/StatsStrip';
import CategoryGrid from '@/components/home/CategoryGrid';
import LatestReports from '@/components/home/LatestReports';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-8 md:px-6 md:py-12">
      <HeroSection />
      <StatsStrip />
      <CategoryGrid />
      <LatestReports />
    </div>
  );
}
