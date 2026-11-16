/**
 * Defaults for settings, served when a key has never been saved.
 *
 * The database seeds its defaults only when the tables are first created, so
 * a key added later (like lead alerts) would otherwise read back as null for
 * ever, and any admin page built on it would render nothing. The settings API
 * falls back to this map instead.
 *
 * Plain data only - no database imports - so client code can use it too.
 */
export const SETTING_DEFAULTS: Record<string, unknown> = {
  lead_alerts: {
    enabled: true,
    from: 'hello@marrelay.com',
    to: ['hello@marrelay.com'],
    cc: ['jainam.shah@marrelay.com', 'binni.shah@marrelay.com', 'email.jainam@gmail.com', 'work.binni@gmail.com'],
    includeSpam: false,
  },
  lead_email_template: {
    subject: 'New lead: {{name}}{{company_paren}} · {{form}}',
    intro: '',
    footerNote: 'Internal alert · Follow up from the lead dashboard.',
    buttonLabel: 'View lead',
    showScore: true,
  },
  storage: { limitBytes: 1024 * 1024 * 1024 },
}
