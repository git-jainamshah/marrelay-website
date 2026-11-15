/**
 * The one page header. Kicker (where you are), title, a plain-English line on
 * what this page changes, and the actions on the right.
 */
export default function PageHeader({
  kicker, title, description, actions, children,
}: {
  kicker?: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="ad-page-head">
      <div className="ad-page-head-main">
        {kicker && <div className="ad-kicker">{kicker}</div>}
        <h1>{title}</h1>
        {description && <p className="ad-page-desc">{description}</p>}
        {children}
      </div>
      {actions && <div className="ad-page-actions">{actions}</div>}
    </div>
  )
}
