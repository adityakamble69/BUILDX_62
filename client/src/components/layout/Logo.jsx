/** @param {{ size?: number, mode?: 'light' | 'dark' }} props */
export default function Logo({ size = 32, mode = 'light' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M16 2C9.9 2 5 6.8 5 12.8 5 20.6 16 30 16 30s11-9.4 11-17.2C27 6.8 22.1 2 16 2Z"
          fill="#0F766E"
        />
        <circle cx="16" cy="12.5" r="4.2" fill="#FFFFFF" />
      </svg>
      <span
        className={`font-heading text-xl font-bold ${mode === 'dark' ? 'text-white' : 'text-secondary-600'}`}
      >
        Civic Fix
      </span>
    </span>
  );
}
