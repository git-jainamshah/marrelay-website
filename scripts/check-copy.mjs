// Guards the site copy: no em dashes (U+2014) in anything that renders on the
// public site. Runs before every build; fails the build with file:line.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
const roots = ['app', 'components', 'lib']
const skip = /node_modules|\/admin\/|\.test\.|media-manifest\.json/
const bad = []
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f); const st = statSync(p)
  if (st.isDirectory()) return walk(p)
  if (!/\.(tsx?|mdx?)$/.test(p) || skip.test(p)) return
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => { if (line.includes('—')) bad.push(`${p}:${i + 1}`) })
})
roots.forEach(walk)
if (bad.length) { console.error('Em dashes are not allowed in site copy:\n  ' + bad.join('\n  ')); process.exit(1) }
console.log('copy check: no em dashes')
