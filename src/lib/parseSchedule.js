import * as XLSX from 'xlsx'

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
const clean = (v) => String(v ?? '').trim()

const MONTHS = {
  jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, abr: 4, may: 5, mai: 5, jun: 6, jul: 7,
  aug: 8, ago: 8, sep: 9, set: 9, oct: 10, out: 10, nov: 11, dec: 12, dez: 12,
}

const iso = (y, m, d) => {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Try to extract a date (YYYY-MM-DD) from free text such as "HANDOVER FOR 01/10/2026". */
export function extractDate(text) {
  const t = String(text ?? '').toLowerCase()
  const year = new Date().getFullYear()
  let m

  if ((m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) return iso(+m[1], +m[2], +m[3])

  if ((m = t.match(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/))) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return iso(y, +m[2], +m[1]) // day/month/year
  }

  const re1 = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:de\s+|of\s+)?([a-zç]{3,10})\.?(?:,?\s+(?:de\s+)?(\d{4}))?/g
  for (const x of t.matchAll(re1)) {
    const mo = MONTHS[x[2].slice(0, 3)]
    if (mo) return iso(x[3] ? +x[3] : year, mo, +x[1])
  }

  const re2 = /([a-zç]{3,10})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/g
  for (const x of t.matchAll(re2)) {
    const mo = MONTHS[x[1].slice(0, 3)]
    if (mo) return iso(x[3] ? +x[3] : year, mo, +x[2])
  }
  return null
}

/** Locate the header row (the one containing DRIVER and VEHICLE) in any sheet. */
function locateTable(wb) {
  for (const name of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false, blankrows: false })
    for (let i = 0; i < Math.min(grid.length, 30); i++) {
      const heads = grid[i].map(norm)
      if (heads.includes('DRIVER') && heads.includes('VEHICLE')) {
        return { grid, headerIndex: i, heads, sheetName: name }
      }
    }
  }
  return null
}

/**
 * Parse an .xlsx File into { rows, date }.
 * `date` (YYYY-MM-DD) is detected from the HANDOVER header, then other cells
 * above the table, then the sheet name; it is null if nothing is found.
 */
export async function parseScheduleFile(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const found = locateTable(wb)
  if (!found) {
    throw new Error('Could not find the header row. Expected columns: VEHICLE, DRIVER, ROUTE NUMBER… (sheets checked: ' + wb.SheetNames.join(', ') + ')')
  }

  const { grid, headerIndex, heads, sheetName } = found
  const idx = (test) => heads.findIndex(test)
  const col = {
    vehicle: idx((h) => h === 'VEHICLE'),
    driver: idx((h) => h === 'DRIVER'),
    earliest: idx((h) => h === 'EARLIEST START TIME'),
    latest: idx((h) => h === 'LATEST START TIME'),
    route: idx((h) => h === 'ROUTE NUMBER'),
    notes: idx((h) => h.startsWith('HANDOVER')),
  }
  const get = (row, i) => (i >= 0 ? clean(row[i]) : '')

  const rows = grid
    .slice(headerIndex + 1)
    .map((r) => ({
      vehicle: get(r, col.vehicle),
      driver: get(r, col.driver),
      earliestStart: get(r, col.earliest),
      latestStart: get(r, col.latest),
      route: get(r, col.route),
      notes: get(r, col.notes),
    }))
    .filter((r) => r.driver)

  if (!rows.length) throw new Error('Header found, but there are no driver rows below it.')

  const candidates = [
    col.notes >= 0 ? grid[headerIndex][col.notes] : '',
    ...grid.slice(0, headerIndex).flat(),
    ...grid[headerIndex],
    sheetName,
    file.name,
  ]
  let date = null
  for (const c of candidates) {
    date = extractDate(c)
    if (date) break
  }

  return { rows, date }
}
