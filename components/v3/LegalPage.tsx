import Link from 'next/link'
import { formatLegalDate, sanitizeHtml } from '@/lib/admin/legal-defaults'

type Doc = { html: string; updatedAt: string }

/**
 * Splits the admin-authored legal HTML at each <h2> into numbered sections.
 * The HTML itself is unchanged and still sanitised exactly as before: this
 * only decides where each section starts, for the v3 layout and contents list.
 */
function splitSections(html: string) {
  // House style: no em dashes anywhere on the public site, even in admin-authored text.
  const clean = sanitizeHtml(html).replace(/\s*\u2014\s*/g, ', ')
  const parts = clean.split(/(?=<h2[\s>])/i)
  const intro = parts[0] && !/^<h2[\s>]/i.test(parts[0]) ? parts.shift()! : ''
  const sections = parts.map((p, i) => {
    const m = p.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const heading = m ? m[1].replace(/<[^>]+>/g, '').trim() : `Section ${i + 1}`
    const body = m ? p.slice(m[0].length) : p
    return { id: `lg-${i}`, n: String(i + 1).padStart(2, '0'), heading, body }
  })
  return { intro, sections }
}

export default function LegalPage({
  title, active, intro, doc,
}: { title: string; active: 'privacy' | 'terms'; intro: string; doc: Doc }) {
  const { intro: introHtml, sections } = splitSections(doc.html)
  return (
    <>
      <section className="v-wrap v-top-sm">
        <nav className="v-legal-tabs" aria-label="Legal pages">
          <Link href="/privacy" className={active === 'privacy' ? 'on' : undefined}>Privacy Policy</Link>
          <Link href="/terms" className={active === 'terms' ? 'on' : undefined}>Terms of Service</Link>
        </nav>
        <div className="v-legal-title">
          <h1 data-reveal>{title}</h1>
          <div data-reveal data-delay="1">
            <span className="v-label">Last updated {formatLegalDate(doc.updatedAt)}</span>
            <p>{intro}</p>
          </div>
        </div>
      </section>

      <section className="v-wrap v-art-layout" style={{ paddingTop: 'clamp(48px,6vw,88px)', paddingBottom: 'clamp(88px,11vw,152px)' }}>
        {sections.length > 1 && (
          <aside className="v-toc v-legal-toc" aria-label="Contents">
            <span className="v-label">Contents</span>
            <nav>
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}><span>{s.n}</span>{s.heading}</a>
              ))}
            </nav>
          </aside>
        )}
        <div className="v-legal-body">
          {introHtml && <div className="v-lsec"><div className="c legal-copy" dangerouslySetInnerHTML={{ __html: introHtml }} /></div>}
          {sections.map((s) => (
            <div key={s.id} id={s.id} className="v-lsec">
              <span className="n">{s.n}</span>
              <div className="c">
                <h2>{s.heading}</h2>
                <div className="legal-copy" style={{ display: 'flex', flexDirection: 'column', gap: 14 }} dangerouslySetInnerHTML={{ __html: s.body }} />
              </div>
            </div>
          ))}
          <div className="v-ask">
            <span>
              <b>Questions about this page?</b>
              <span>Write to us and a founder will reply within one business day.</span>
            </span>
            <a href="mailto:hello@marrelay.com" className="btn btn-dark">hello@marrelay.com</a>
          </div>
        </div>
      </section>
    </>
  )
}
