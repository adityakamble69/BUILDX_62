/** Tokens come from docs/design.md. Do not add colors, fonts, or shadows here without updating that file first. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#F0FDFA', 600: '#0F766E', 700: '#115E59' },
        secondary: { 600: '#1E293B' },
        accent: { 500: '#F59E0B' },
        status: { reported: '#F59E0B', progress: '#2563EB', resolved: '#16A34A', rejected: '#6B7280' },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#2563EB',
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        ink: { DEFAULT: '#0F172A', muted: '#475569', subtle: '#94A3B8' },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '16px' },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,.06)',
        md: '0 4px 12px rgba(15,23,42,.10)',
        lg: '0 12px 32px rgba(15,23,42,.16)',
      },
    },
  },
  plugins: [],
};
