/** Settings keys the admin may read and write through /api/admin/settings. */
export const ALLOWED_SETTING_KEYS = [
  'announcement', 'promo_banner', 'robots_txt', 'seo', 'company', 'socials', 'legal_terms', 'legal_privacy', 'media_slots', 'storage', 'lead_alerts', 'lead_email_template',
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
  storage: 'Storage limit',
  lead_alerts: 'New-lead email alerts',
  lead_email_template: 'Lead email template',
}

/** Site storage ceiling, in bytes. 1 GB by default; only admins may change it. */
export const DEFAULT_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024
export type StorageCfg = { limitBytes: number }

export function isSettingKey(k: string): k is SettingKey {
  return (ALLOWED_SETTING_KEYS as readonly string[]).includes(k)
}
