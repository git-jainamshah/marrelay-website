/* eslint-disable @next/next/no-img-element */

/**
 * Consistent "tools we work with" row: real marks, grey until hover, and
 * always an "and more" note so it reads as examples, not a fixed stack.
 */
export default function ToolsRow({ tools, label = 'Tools we work with' }: { tools: { name: string; src: string }[]; label?: string }) {
  if (!tools.length) return null
  return (
    <div className="v-tools" aria-label={label}>
      <span className="v-kick">{label}</span>
      {tools.map((t) => (
        <img key={t.src} src={t.src} alt={t.name} title={t.name} loading="lazy" />
      ))}
      <span className="t">and more</span>
    </div>
  )
}
