/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode disabled: Leaflet mutates DOM directly and crashes on Strict Mode's
  // double-mount in dev (TypeError: Cannot read properties of undefined reading '_leaflet_pos').
  // Production is unaffected — Strict Mode only runs in development.
  reactStrictMode: false,
  images: {
    // Report photos live in the public Supabase Storage bucket `report-images`.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/report-images/**' },
    ],
  },
};

module.exports = nextConfig;
