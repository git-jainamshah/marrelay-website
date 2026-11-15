/** Settings keys the admin may read and write through /api/admin/settings. */
export const ALLOWED_SETTING_KEYS = [
  'announcement', 'promo_banner', 'robots_txt', 'seo', 'company', 'socials', 'legal_terms', 'legal_privacy', 'media_slots',
] as const

export type SettingKey = (typeof ALLOWED_SETTING_KEYS)[number]

/** Human names used in toasts and the version history drawer. */
export const SETTING_LABELS: Record<SettingKey, string> = {
  announcement: 'Top announcement bar',
  promo_banner: 'Promo pop-up',
  robots_txt: 'robots.txt',
  seo: 'SEO settings',
  company: 'Company profile',
  socials: 'Social links',
  legal_terms: 'Terms of Service',
  legal_privacy: 'Privacy Policy',
  media_slots: 'Media slots',
}

export function isSettingKey(k: string): k is SettingKey {
  return (ALLOWED_SETTING_KEYS as readonly string[]).includes(k)
}
