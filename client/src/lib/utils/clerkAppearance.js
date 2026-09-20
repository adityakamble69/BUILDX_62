/**
 * Clerk renders its own DOM, so it cannot pick up Tailwind tokens automatically.
 * These values mirror docs/design.md — update there first if they ever change.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#0F766E',
    colorText: '#0F172A',
    colorTextSecondary: '#475569',
    colorBackground: '#FFFFFF',
    colorDanger: '#DC2626',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    borderRadius: '10px',
    fontFamily: 'var(--font-body)',
  },
  elements: {
    card: 'shadow-md border border-border',
    headerTitle: 'font-heading',
    formButtonPrimary: 'h-11 font-semibold normal-case',
  },
};
