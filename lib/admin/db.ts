/**
 * Admin backend - Postgres data layer (Vercel/Neon compatible).
 * Schema is created + seeded automatically on first use.
 */
import crypto from 'crypto'
import { q, q1, run } from './pg'
import { hashPassword } from './auth'
import { PRICING_DEFAULTS } from './pricing-defaults'

let ready: Promise<void> | null = null

/** Ensure schema + seeds exist (memoized per process). */
export function ensureDb(): Promise<void> {
  if (!ready) ready = migrateAndSeed()
  return ready
}

async function migrateAndSeed() {
  await run(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    active INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login TIMESTAMPTZ
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    rel_path TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL,
    mime TEXT,
    size BIGINT NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    modified_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS tag_managers (
    id SERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    container_id TEXT NOT NULL,
    environment TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS scripts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'head',
    timing TEXT NOT NULL DEFAULT 'after_tm',
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    environment TEXT NOT NULL DEFAULT 'all',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    page_key TEXT NOT NULL,
    idx INTEGER NOT NULL,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    price_note TEXT,
    billing TEXT,
    description TEXT,
    tag TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    items TEXT NOT NULL DEFAULT '[]',
    cta_label TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(page_key, idx)
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    public_id TEXT,
    consent INTEGER NOT NULL DEFAULT 1,
    consent_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    message TEXT,
    source_page TEXT,
    form_type TEXT NOT NULL DEFAULT 'contact',
    package_interest TEXT,
    extra TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS leads_marketing (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    -- identifiers
    ga_client_id TEXT,
    ga_session_id TEXT,
    session_id TEXT,
    -- ad platform click ids
    gclid TEXT, gbraid TEXT, wbraid TEXT, fbclid TEXT, li_fat_id TEXT,
    ttclid TEXT, epik TEXT, msclkid TEXT, dclid TEXT, twclid TEXT,
    sclid TEXT, irclickid TEXT,
    other_click_ids TEXT,               -- JSON of any additional *clid params
    -- first-touch attribution
    first_source TEXT, first_medium TEXT, first_campaign TEXT,
    first_term TEXT, first_content TEXT, first_channel_group TEXT,
    first_touch_at TEXT,
    -- session-touch attribution
    session_source TEXT, session_medium TEXT, session_campaign TEXT,
    session_term TEXT, session_content TEXT, session_channel_group TEXT,
    -- context
    referrer_url TEXT,
    landing_page TEXT,
    user_agent TEXT,
    -- numeric budget range parsed from the form for range filtering
    budget_min NUMERIC,
    budget_max NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  await run(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  // Append-only version history of every settings save, so any change made
  // in the admin can be reviewed and restored. Additive table: the live
  // `settings` row is still the single source of truth for the site.
  await run(`
  CREATE TABLE IF NOT EXISTS settings_history (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    changed_by TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  await run(`CREATE INDEX IF NOT EXISTS settings_history_key_idx ON settings_history (key, id DESC)`)
  // Who signed in and out of the admin, and when. Admin-only view. Additive.
  await run(`
  CREATE TABLE IF NOT EXISTS login_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_email TEXT,
    user_name TEXT,
    event TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  await run(`CREATE INDEX IF NOT EXISTS login_events_created_idx ON login_events (created_at DESC)`)
  await run(`
  CREATE TABLE IF NOT EXISTS leads_offline (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    lead_kind TEXT NOT NULL DEFAULT 'offline',
    contact_method TEXT,
    added_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS lead_notes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    author_name TEXT,
    author_email TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  /* Who was @-mentioned in a note. Its own table rather than a column on
     lead_notes so "everything waiting on me" is one indexed query, and so a
     mention can be resolved independently of the note it came from. */
  CREATE TABLE IF NOT EXISTS lead_note_mentions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES lead_notes(id),
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
  );

  /* In-app notifications. emailed_at is unused today and deliberately present
     so email delivery can be added later without touching this table. */
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    kind TEXT NOT NULL,
    lead_id INTEGER REFERENCES leads(id),
    note_id INTEGER REFERENCES lead_notes(id),
    actor_user_id INTEGER REFERENCES users(id),
    preview TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    emailed_at TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS billing_accounts (
    id SERIAL PRIMARY KEY,
    public_id TEXT,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    last4 TEXT,
    currency TEXT NOT NULL DEFAULT 'CAD',
    owner_type TEXT NOT NULL DEFAULT 'company',
    owner_name TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_id TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'one_off',
    category TEXT,
    vendor TEXT,
    tool_name TEXT,
    description TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    billing_account_id INTEGER REFERENCES billing_accounts(id),
    frequency TEXT,
    start_date DATE,
    expiry_date DATE,
    expense_date DATE,
    receipt_id TEXT,
    marketing_type TEXT,
    marketing_platform TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    public_id TEXT,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS client_projects (
    id SERIAL PRIMARY KEY,
    public_id TEXT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    currency TEXT NOT NULL DEFAULT 'CAD',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    project_id INTEGER REFERENCES client_projects(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    issue_date DATE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'draft',
    currency TEXT NOT NULL DEFAULT 'CAD',
    items TEXT,
    discount_type TEXT NOT NULL DEFAULT 'none',
    discount_value NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC NOT NULL DEFAULT 13,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_email TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS blog_views (
    slug TEXT PRIMARY KEY,
    views INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  // ---- Migrations for existing databases (idempotent) ----
  const alters = [
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS public_id TEXT`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS marketing_type TEXT`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS marketing_platform TEXT`,
    // Threaded replies: NULL parent_id means a top-level comment, so every
    // existing note stays top-level and unchanged.
    `ALTER TABLE lead_notes ADD COLUMN IF NOT EXISTS parent_id INTEGER`,
    `ALTER TABLE lead_notes ADD COLUMN IF NOT EXISTS author_user_id INTEGER`,
    // Pipeline owner. NULL = unassigned, which is what every existing lead
    // stays until someone assigns it - nothing is silently reassigned.
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_user_id INTEGER`,
    // Notes are soft-deleted and edits are marked, never silently rewritten -
    // this thread is an accountability record, so history has to survive.
    `ALTER TABLE lead_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
    `ALTER TABLE lead_notes ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`,
  ]
  for (const sql of alters) { try { await run(sql) } catch { /* column exists */ } }
  try { await run(`CREATE UNIQUE INDEX IF NOT EXISTS leads_public_id_idx ON leads (public_id)`) } catch { /* exists */ }

  // Indexes for the activity thread, mention queue, and notification bell -
  // each is read on nearly every admin page load.
  for (const sql of [
    `CREATE INDEX IF NOT EXISTS lead_notes_lead_idx ON lead_notes (lead_id)`,
    `CREATE INDEX IF NOT EXISTS lead_note_mentions_user_idx ON lead_note_mentions (user_id, resolved_at)`,
    `CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, read_at)`,
    `CREATE INDEX IF NOT EXISTS leads_owner_idx ON leads (owner_user_id)`,
  ]) { try { await run(sql) } catch { /* exists */ } }

  // Backfill: consent paper trail for pre-existing leads (submitted before the checkbox existed)
  try { await run(`UPDATE leads SET consent_at = created_at WHERE consent_at IS NULL`) } catch { /* ok */ }

  // Backfill: alphanumeric public lead IDs
  try {
    const missingIds = await q<{ id: number }>(`SELECT id FROM leads WHERE public_id IS NULL`)
    for (const r of missingIds) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await run(`UPDATE leads SET public_id = $1 WHERE id = $2`, [generateLeadPublicId(), r.id])
          break
        } catch { /* collision - retry */ }
      }
    }
  } catch { /* ok */ }

  // Backfill: every lead gets at least Direct attribution
  try {
    await run(`UPDATE leads_marketing SET
      first_source = COALESCE(first_source, '(direct)'),
      first_medium = COALESCE(first_medium, '(none)'),
      first_channel_group = COALESCE(first_channel_group, 'Direct'),
      session_source = COALESCE(session_source, first_source, '(direct)'),
      session_medium = COALESCE(session_medium, first_medium, '(none)'),
      session_channel_group = COALESCE(session_channel_group, first_channel_group, 'Direct')`)
    const noMarketing = await q<{ id: number }>(
      `SELECT l.id FROM leads l LEFT JOIN leads_marketing m ON m.lead_id = l.id WHERE m.id IS NULL`
    )
    for (const r of noMarketing) {
      await run(
        `INSERT INTO leads_marketing (lead_id, first_source, first_medium, first_channel_group,
          session_source, session_medium, session_channel_group)
         VALUES ($1, '(direct)', '(none)', 'Direct', '(direct)', '(none)', 'Direct')`,
        [r.id]
      )
    }
  } catch { /* ok */ }

  // ---- One-time rebrand: Martek -> Marrelay in already-stored settings ----
  // The live DB was seeded with the old brand. This rewrites brand text inside
  // company profile, SEO, socials, and legal copy. Targeted tokens only, so it
  // never touches asset paths (e.g. legacy /assets/martek-*.png) or custom values.
  try {
    const done = await q1<{ key: string }>(`SELECT key FROM settings WHERE key = 'brand_marrelay_v1'`)
    if (!done) {
      const rebrand = (s: string) => s
        .split('hello@martek.studio').join('hello@marrelay.com')
        .split('Martek Reimagined').join('Marrelay Reimagined')
        .split('Martek Group').join('Marrelay')
        .split('martek-studio').join('marrelay')
        .split('martek.studio').join('marrelay')
        .split('martekgroup').join('marrelay')
        .split('Martek').join('Marrelay')
      const rows = await q<{ key: string; value: string }>('SELECT key, value FROM settings')
      for (const r of rows) {
        const nv = rebrand(r.value)
        if (nv !== r.value) await run('UPDATE settings SET value = $1 WHERE key = $2', [nv, r.key])
      }
      await run(`INSERT INTO settings (key, value) VALUES ('brand_marrelay_v1', '"done"') ON CONFLICT (key) DO NOTHING`)
    }
  } catch { /* ok */ }

  // ---- One-time: point stored logo paths at the Marrelay asset files ----
  // Settings (company logoFull/logoIcon, etc.) were saved with the legacy
  // /assets/martek-*.png filenames. Those files were renamed and the
  // "Martek Group" artwork replaced, so repoint any stored reference. The
  // next.config.js rewrites still serve the old URLs for external caches.
  try {
    const done = await q1<{ key: string }>(`SELECT key FROM settings WHERE key = 'brand_assets_marrelay_v1'`)
    if (!done) {
      const repoint = (s: string) => s
        .split('/assets/martek-group-header.png').join('/assets/marrelay-header.png')
        .split('/assets/martek-offical-logo.png').join('/assets/marrelay-official-logo.png')
        .split('/assets/martek-only-logo.png').join('/assets/marrelay-only-logo.png')
        .split('/assets/martek-mark.png').join('/assets/marrelay-mark.png')
      const rows = await q<{ key: string; value: string }>('SELECT key, value FROM settings')
      for (const r of rows) {
        const nv = repoint(r.value)
        if (nv !== r.value) await run('UPDATE settings SET value = $1 WHERE key = $2', [nv, r.key])
      }
      await run(`INSERT INTO settings (key, value) VALUES ('brand_assets_marrelay_v1', '"done"') ON CONFLICT (key) DO NOTHING`)
    }
  } catch { /* ok */ }

  // ---- One-time: /#pricing -> /pricing in already-stored settings ----
  // Pricing used to exist twice: a section at /#pricing on the homepage and a
  // separate /pricing page. They are now one URL. Announcement-bar CTAs are
  // admin-managed and live in the DB, so changing the seed above is not enough
  // for environments that were already seeded.
  try {
    const done = await q1<{ key: string }>(`SELECT key FROM settings WHERE key = 'pricing_url_v1'`)
    if (!done) {
      const rows = await q<{ key: string; value: string }>('SELECT key, value FROM settings')
      for (const r of rows) {
        const nv = r.value.split('/#pricing').join('/pricing')
        if (nv !== r.value) await run('UPDATE settings SET value = $1 WHERE key = $2', [nv, r.key])
      }
      await run(`INSERT INTO settings (key, value) VALUES ('pricing_url_v1', '"done"') ON CONFLICT (key) DO NOTHING`)
    }
  } catch { /* ok */ }

  // ---- Seed first admin ----
  const userCount = await q1<{ c: string }>('SELECT COUNT(*)::int AS c FROM users')
  if (Number(userCount?.c) === 0) {
    await run(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, 'admin', 0)`,
      ['Jainam', 'Shah', 'email.jainam@gmail.com', hashPassword('Password@023!')]
    )
  }

  // ---- Push the user list to qa/dev ----
  // Runs once per production cold start. Backfills accounts that existed before
  // syncing was switched on, and repairs any drift from a change made while
  // qa/dev was unreachable. Every individual change syncs at the time it happens;
  // this is the safety net. No-op outside production or without the env var.
  try {
    const { userSyncEnabled, syncAllUsers } = require('./user-sync') as typeof import('./user-sync')
    if (userSyncEnabled()) {
      const all = await q<any>(
        `SELECT first_name, last_name, email, password_hash, role, active, must_change_password FROM users`
      )
      await syncAllUsers(all)
    }
  } catch (e) {
    console.error('user backfill to qa/dev failed', e)
  }

  // ---- Seed media index from the build-time manifest ----
  const mediaCount = await q1<{ c: number }>('SELECT COUNT(*)::int AS c FROM media')
  if (Number(mediaCount?.c) === 0) {
    try {
      const { loadMediaManifest } = require('./media') as typeof import('./media')
      for (const f of loadMediaManifest().files) {
        await run(
          `INSERT INTO media (filename, rel_path, kind, mime, size, added_at, modified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $6) ON CONFLICT (rel_path) DO NOTHING`,
          [f.filename, f.relPath, f.kind, f.mime, f.size, f.modifiedAt]
        )
      }
    } catch { /* manifest missing - media gets indexed on first admin visit */ }
  }

  // ---- Seed pricing packages ----
  const pkgCount = await q1<{ c: number }>('SELECT COUNT(*)::int AS c FROM packages')
  if (Number(pkgCount?.c) === 0) {
    for (const [pageKey, pkgs] of Object.entries(PRICING_DEFAULTS)) {
      for (let i = 0; i < pkgs.length; i++) {
        const p = pkgs[i]
        await run(
          `INSERT INTO packages (page_key, idx, name, price, price_note, billing, description, tag, featured, items, cta_label)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (page_key, idx) DO NOTHING`,
          [pageKey, i, p.name, p.price, p.priceNote ?? null, p.billing ?? null,
           p.description ?? null, p.tag ?? null, p.featured ? 1 : 0,
           JSON.stringify(p.items ?? []), p.ctaLabel ?? null]
        )
      }
    }
  }

  // ---- Seed default settings ----
  const defaults: Record<string, unknown> = {
    announcement: {
      // **bold** renders as bold on the site; `enabled:false` hides the whole top bar
      enabled: true,
      default: {
        pill: 'New',
        text: 'We just launched a **fixed-price startup sprint**: a landing page in 14 days.',
        ctaLabel: 'See sprint pricing',
        ctaHref: '/pricing',
        contactHref: '/contact',
      },
      overrides: [
        { path: '/services/web-development', pill: 'Web', text: 'Most launch sites go live in **4–6 weeks**. Landing-page sprints in 14 days.', ctaLabel: 'Start yours', ctaHref: '/contact?service=web', contactHref: '/contact?service=web' },
        { path: '/services/data-analytics', pill: 'Data', text: 'Most teams get a **clean dashboard + weekly report** within two weeks of kickoff.', ctaLabel: 'Get set up', ctaHref: '/contact?service=data', contactHref: '/contact?service=data' },
        { path: '/services/social', pill: 'Social', text: 'We become your **in-house content team**, strategy, posts, replies, and creator deals.', ctaLabel: "Let's talk", ctaHref: '/contact?service=social', contactHref: '/contact?service=social' },
        { path: '/services/seo-ads', pill: 'SEO & Ads', text: 'We move your **cost-per-acquisition down**, week by week, with receipts.', ctaLabel: 'Get a plan', ctaHref: '/contact?service=seo', contactHref: '/contact?service=seo' },
        { path: '/services/engineering', pill: 'Engineering', text: 'The side of the studio we built **first**, 4 years of CAD, drafting & 3D modelling.', ctaLabel: 'Send a brief', ctaHref: '/contact?service=engineering', contactHref: '/contact?service=engineering' },
        { path: '/contact', pill: 'Open', text: 'Currently taking on **new projects** - we keep slots limited to stay hands-on.', ctaLabel: 'Grab a slot', ctaHref: '/contact#form', contactHref: '/contact#form' },
      ],
    },
    promo_banner: {
      enabled: false,
      template: 'copy',
      title: '',
      body: '',
      imageUrl: '',
      primaryLabel: 'Learn more',
      primaryHref: '/contact',
      secondaryLabel: '',
      secondaryHref: '',
      delaySeconds: 3,
      frequency: 'once-per-session',
    },
    robots_txt: { extraDisallow: [] as string[], extraRules: '' },
    seo: { siteUrl: 'https://www.marrelay.com', googleVerification: '', bingVerification: '' },
    // Finance: FX rates express "1 unit of currency = X CAD" (base = CAD).
    // Editable in Admin → Finance. Defaults are approximate - update as needed.
    fx_rates: { base: 'CAD', updatedAt: new Date().toISOString(), rates: { CAD: 1, USD: 1.37, EUR: 1.48, INR: 0.016 } },
    company: {
      name: 'Marrelay',
      tagline: 'Digital studio',
      addressLine1: 'Toronto, ON',
      addressLine2: 'Canada',
      email: 'hello@marrelay.com',
      phone: '',
      logoFull: '/assets/marrelay-header.png',
      logoIcon: '/assets/marrelay-mark.png',
    },
    socials: [
      { platform: 'Instagram', label: '@marrelay', href: 'https://www.instagram.com/marrelay', enabled: true },
      { platform: 'LinkedIn', label: '/company/marrelay', href: 'https://www.linkedin.com/company/marrelay', enabled: true },
      { platform: 'X', label: '@marrelay', href: 'https://x.com/marrelay', enabled: true },
      { platform: 'Facebook', label: '/marrelay', href: 'https://www.facebook.com/marrelay', enabled: true },
    ],
  }
  for (const [k, v] of Object.entries(defaults)) {
    await run(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [k, JSON.stringify(v)]
    )
  }

  // Legal pages: seed from the original hardcoded copy
  const { TERMS_DEFAULT_HTML, PRIVACY_DEFAULT_HTML } = require('./legal-defaults') as typeof import('./legal-defaults')
  const legalSeeds: Record<string, unknown> = {
    legal_terms: { html: TERMS_DEFAULT_HTML, updatedAt: new Date().toISOString() },
    legal_privacy: { html: PRIVACY_DEFAULT_HTML, updatedAt: new Date().toISOString() },
  }
  for (const [k, v] of Object.entries(legalSeeds)) {
    await run(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [k, JSON.stringify(v)]
    )
  }
}

export const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
}

// ---------- settings helpers ----------
export async function getSetting<T>(key: string): Promise<T | null> {
  await ensureDb()
  const row = await q1<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key])
  return row ? (JSON.parse(row.value) as T) : null
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await ensureDb()
  await run(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  )
}

export type SettingVersion = { id: number; key: string; value: unknown; changed_by: string | null; note: string | null; created_at: string }

/**
 * Record a version of a setting. On the first save of a key, the value that
 * was live before the change is captured as a baseline first, so there is
 * always something to go back to.
 */
export async function recordSettingVersion(key: string, value: unknown, changedBy: string | null, note?: string): Promise<void> {
  try {
    const has = await q1<{ id: number }>('SELECT id FROM settings_history WHERE key = $1 LIMIT 1', [key])
    if (!has) {
      const live = await q1<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key])
      if (live) await run('INSERT INTO settings_history (key, value, changed_by, note) VALUES ($1, $2, NULL, $3)', [key, live.value, 'Before first edit'])
    }
    await run('INSERT INTO settings_history (key, value, changed_by, note) VALUES ($1, $2, $3, $4)', [key, JSON.stringify(value), changedBy, note ?? null])
    // Keep the table bounded: the 60 most recent versions per key.
    await run(
      `DELETE FROM settings_history WHERE key = $1 AND id NOT IN (SELECT id FROM settings_history WHERE key = $1 ORDER BY id DESC LIMIT 60)`,
      [key]
    )
  } catch { /* history must never break the save */ }
}

export async function listSettingVersions(key: string, limit = 40): Promise<SettingVersion[]> {
  await ensureDb()
  const rows = await q<{ id: number; key: string; value: string; changed_by: string | null; note: string | null; created_at: string }>(
    'SELECT id, key, value, changed_by, note, created_at FROM settings_history WHERE key = $1 ORDER BY id DESC LIMIT $2',
    [key, limit]
  )
  return rows.map((r) => ({ ...r, value: JSON.parse(r.value) }))
}

export async function getSettingVersion(key: string, id: number): Promise<SettingVersion | null> {
  await ensureDb()
  const r = await q1<{ id: number; key: string; value: string; changed_by: string | null; note: string | null; created_at: string }>(
    'SELECT id, key, value, changed_by, note, created_at FROM settings_history WHERE key = $1 AND id = $2',
    [key, id]
  )
  return r ? { ...r, value: JSON.parse(r.value) } : null
}

export type LoginEventKind = 'login' | 'logout' | 'failed'
export async function recordLoginEvent(e: { userId?: number | null; email?: string | null; name?: string | null; event: LoginEventKind; ip?: string | null; userAgent?: string | null }): Promise<void> {
  try {
    await run(
      'INSERT INTO login_events (user_id, user_email, user_name, event, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
      [e.userId ?? null, e.email ?? null, e.name ?? null, e.event, e.ip ?? null, (e.userAgent ?? '').slice(0, 300) || null]
    )
  } catch { /* never block sign-in on logging */ }
}

export async function audit(userEmail: string | null, action: string, detail?: string): Promise<void> {
  try {
    await run('INSERT INTO audit_log (user_email, action, detail) VALUES ($1, $2, $3)', [userEmail, action, detail ?? null])
  } catch { /* audit must never break the main action */ }
}

/**
 * Permanently remove leads that have sat in the Delete Folder for 60+ days.
 * Called from the admin leads APIs (serverless-friendly, no cron needed).
 */
export async function purgeExpiredDeletedLeads(): Promise<number> {
  try {
    const expired = await q<{ id: number }>(
      `SELECT id FROM leads WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '60 days'`
    )
    for (const r of expired) {
      await run('DELETE FROM leads_marketing WHERE lead_id = $1', [r.id])
      await run('DELETE FROM leads_offline WHERE lead_id = $1', [r.id])
      await run('DELETE FROM lead_notes WHERE lead_id = $1', [r.id])
      await run('DELETE FROM leads WHERE id = $1', [r.id])
    }
    return expired.length
  } catch {
    return 0
  }
}

/** 6-character alphanumeric lead ID (unambiguous charset, e.g. "K7M3QD"). */
export function generateLeadPublicId(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join('')
}

export function generateTempPassword(): string {
  const words = ['Maple', 'Harbor', 'Studio', 'Signal', 'Comet', 'Orbit', 'Pixel', 'Vector', 'Nova', 'Atlas']
  const w = words[crypto.randomInt(words.length)]
  const n = crypto.randomInt(1000, 9999)
  const s = '!@#$%'[crypto.randomInt(5)]
  return `Marrelay-${w}${n}${s}`
}
