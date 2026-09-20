/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Report photos live in the public Supabase Storage bucket `report-images`.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/report-images/**' },
    ],
  },
};

module.exports = nextConfig;
