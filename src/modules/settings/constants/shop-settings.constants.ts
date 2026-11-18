/**
 * The storefront palette every shop starts with. The DB stores only a shop's
 * overrides, so a token added here reaches every shop without a backfill.
 * Keys are the storefront design tokens in camelCase (`mutedLight` →
 * `--muted-light`).
 */
export const DEFAULT_COLOR_SCHEME = {
  /** Page and card background, fill for outline buttons and inputs. */
  background: '#ffffff',
  /** Main text: headings, body copy, product names. */
  foreground: '#111c2d',
  /** Secondary text: descriptions, form labels. */
  muted: '#3d4947',
  /** Tertiary text: captions, breadcrumbs, placeholders, disabled text. */
  mutedLight: '#5f6c69',
  /** Main brand color: primary buttons, links, prices. Also PWA theme_color. */
  accent: '#00685f',
  /** Primary button hover, text on accent-soft backgrounds. */
  accentDark: '#00473f',
  /** Soft button, active nav items, badges. */
  accentSoft: '#e0efea',
  /** Highlighted text on dark accent blocks. */
  accentHighlight: '#89f5e7',
  /** Secondary text on accent backgrounds. */
  onAccentMuted: '#cdeee5',
  /** Lightest tint: section and panel backgrounds. */
  surfaceSoft: '#f4f9f7',
  /** Standard tint for cards, chips and blocks. */
  surface: '#edf5f2',
  /** Darkest tint: skeletons, progress tracks, image placeholders. */
  surfaceStrong: '#d7e9e3',
  /** Default divider and card border. */
  borderSoft: '#dcebe7',
  /** Stronger border: outline buttons, inputs, checkboxes, filters. */
  footerBorder: '#cfe0da',
  /** Footer background and a few sheet panels. */
  footer: '#e6f0ec',
  /** Error icons and accents. */
  error: '#e5484d',
  /** Error text, destructive actions, cancelled status. */
  errorDark: '#b42318',
  /** Error toast border, remove-button hover background. */
  errorBorder: '#f6d0ce',
} as const;

/** Six-digit hex only, so the storefront can derive alpha variants safely. */
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Settings change only on an admin write, which also bumps the shop cache. */
export const SHOP_SETTINGS_CACHE_TTL_SECONDS = 300;

export const SHOP_SETTINGS_CACHE_SEGMENT = 'shop-settings';
