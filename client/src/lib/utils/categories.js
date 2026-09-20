import { Construction, Trash2, Lamp, Droplets, Waves, Ellipsis } from 'lucide-react';

// Mirrors server/sql seed `categories` rows (slug + icon name). Keep in sync with database.md.
export const CATEGORY_ICONS = {
  pothole: Construction,
  garbage: Trash2,
  streetlight: Lamp,
  water_leak: Droplets,
  drainage: Waves,
  other: Ellipsis,
};

export const CATEGORY_LABELS = {
  pothole: 'Pothole',
  garbage: 'Garbage',
  streetlight: 'Streetlight',
  water_leak: 'Water Leak',
  drainage: 'Drainage',
  other: 'Other',
};

/** @param {string} slug */
export function getCategoryIcon(slug) {
  return CATEGORY_ICONS[slug] ?? Ellipsis;
}

/** @param {string} slug */
export function getCategoryLabel(slug) {
  return CATEGORY_LABELS[slug] ?? 'Other';
}
