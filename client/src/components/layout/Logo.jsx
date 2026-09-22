import Image from 'next/image';

/** @param {{ size?: number, mode?: 'light' | 'dark' }} props */
export default function Logo({ size = 32, mode = 'light' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Civic Fix Logo"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        priority
      />
      <span
        className={`font-heading text-xl font-bold ${mode === 'dark' ? 'text-white' : 'text-secondary-600'}`}
      >
        Civic Fix
      </span>
    </span>
  );
}
