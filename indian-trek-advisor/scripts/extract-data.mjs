// Extracts trek data from the client's single-file HTML into JSON files.
// Usage: node scripts/extract-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const html = readFileSync(join(root, '.v0/source/trek_advisor.html'), 'utf8')

/**
 * Slice a top-level `const NAME = [ ... ];` or `{ ... };` block out of the
 * source text by balancing brackets from the opening delimiter.
 */
function sliceConst(name) {
  const declRe = new RegExp(`const\\s+${name}\\s*=\\s*([\\[{])`)
  const m = declRe.exec(html)
  if (!m) throw new Error(`Could not find const ${name}`)
  const open = m[1]
  const close = open === '[' ? ']' : '}'
  let i = m.index + m[0].length - 1 // index of the opening bracket
  let depth = 0
  let inStr = null
  let inLineComment = false
  let inBlockComment = false
  for (; i < html.length; i++) {
    const c = html[i]
    const next = html[i + 1]
    if (inLineComment) {
      if (c === '\n') inLineComment = false
      continue
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; i++ }
      continue
    }
    if (inStr) {
      if (c === '\\') { i++; continue }
      if (c === inStr) inStr = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue }
    if (c === '/' && next === '/') { inLineComment = true; i++; continue }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue }
    if (c === open || (open === '[' && c === '{') || (open === '{' && c === '[')) {
      if (c === open) depth++
      else continue
    }
    if (c === close || (open === '[' && c === '}') || (open === '{' && c === ']')) {
      if (c === close) {
        depth--
        if (depth === 0) break
      }
      continue
    }
  }
  const literal = html.slice(m.index + m[0].length - 1, i + 1)
  return literal
}

// Balanced-bracket slicing above only tracks the primary bracket type, which
// breaks with nested mixed brackets. Use a simpler robust approach: evaluate
// with vm starting at the declaration and let the JS parser find the end.
function extract(name) {
  const declRe = new RegExp(`const\\s+${name}\\s*=`)
  const m = declRe.exec(html)
  if (!m) throw new Error(`Could not find const ${name}`)
  const start = m.index + m[0].length
  // Take a generous chunk after the declaration; the vm approach needs valid JS,
  // so instead do proper bracket balancing tracking ALL bracket types.
  let i = start
  while (/\s/.test(html[i])) i++
  const openChar = html[i]
  if (openChar !== '[' && openChar !== '{') throw new Error(`Unexpected start for ${name}: ${openChar}`)
  let depth = 0
  let inStr = null
  let inLineComment = false
  let inBlockComment = false
  let end = -1
  for (let j = i; j < html.length; j++) {
    const c = html[j]
    const next = html[j + 1]
    if (inLineComment) { if (c === '\n') inLineComment = false; continue }
    if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; j++ } continue }
    if (inStr) {
      if (c === '\\') { j++; continue }
      if (c === inStr) inStr = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue }
    if (c === '/' && next === '/') { inLineComment = true; j++; continue }
    if (c === '/' && next === '*') { inBlockComment = true; j++; continue }
    if (c === '[' || c === '{' || c === '(') depth++
    else if (c === ']' || c === '}' || c === ')') {
      depth--
      if (depth === 0) { end = j; break }
    }
  }
  if (end === -1) throw new Error(`Unbalanced brackets for ${name}`)
  const literal = html.slice(i, end + 1)
  const value = vm.runInNewContext(`(${literal})`, {}, { timeout: 10000 })
  return value
}

const outDir = join(root, 'lib/data')
mkdirSync(outDir, { recursive: true })

const trails = extract('trails')
console.log(`trails: ${trails.length} treks`)
console.log(`  with itinerary: ${trails.filter((t) => Array.isArray(t.itinerary) && t.itinerary.length > 0).length}`)
console.log(`  with overview: ${trails.filter((t) => t.overview).length}`)
console.log(`  kailash_yatra: ${trails.filter((t) => t.category === 'kailash_yatra').length}`)
console.log(`  panch_kedar: ${trails.filter((t) => t.category === 'panch_kedar').length}`)
writeFileSync(join(outDir, 'treks.json'), JSON.stringify(trails, null, 1))

const mapData = extract('TREK_MAP_DATA')
console.log(`TREK_MAP_DATA: ${Object.keys(mapData).length} treks with waypoints`)
writeFileSync(join(outDir, 'trek-map-data.json'), JSON.stringify(mapData, null, 1))

// Gear shop seed data, if present
try {
  const shops = extract('SEED_SHOPS')
  console.log(`SEED_SHOPS: ${shops.length}`)
  writeFileSync(join(outDir, 'gear-shops.json'), JSON.stringify(shops, null, 1))
} catch {
  console.log('No SEED_SHOPS found; will check other names')
}

console.log('Done.')
