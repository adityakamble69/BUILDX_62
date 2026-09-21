// Shared horizontal padding for page shells that fill the full viewport width
// (design.md §12, memory.md D42) instead of the old `mx-auto max-w-[Npx]` centered
// container. Kept in one place so every full-bleed page scales the same way as the
// screen gets wider, rather than each page inventing its own breakpoint list.
export const PAGE_PADDING = 'px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24';
