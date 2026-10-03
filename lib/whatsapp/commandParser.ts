// Reads a host's WhatsApp text into a booking command. Fixed keywords only —
// no AI — but tolerant of small spelling mistakes in commands and month names.

export interface BookingDraft {
  guestName: string | null
  checkIn:   string | null   // YYYY-MM-DD
  checkOut:  string | null   // YYYY-MM-DD, the departure day
  rooms:     number | null
  guests:    number | null
}

export type Command =
  | { kind: 'book';    draft: BookingDraft }
  | { kind: 'check';   checkIn: string | null; checkOut: string | null }
  | { kind: 'list' }
  | { kind: 'rooms';   count: number | null }
  | { kind: 'cancel';  bookingNo: number | null }
  | { kind: 'unknown' }

interface DateSpec {
  day:   number
  month: number          // 1–12
  year:  number | null   // null when the host did not give one
}

const TIME_ZONE = 'Asia/Kolkata'

const COMMAND_WORDS = ['book', 'check', 'list', 'rooms', 'cancel'] as const
type CommandWord = typeof COMMAND_WORDS[number]

const COMMAND_ALIASES: Record<string, CommandWord> = {
  booking:  'book',
  bookings: 'list',
  room:     'rooms',
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}

const RANGE_WORDS = new Set(['to', 'till', 'until', 'upto', '-'])
const CONNECTORS  = new Set(['to', 'till', 'until', 'upto', '-', 'from', 'for', 'on'])

const DAY_RE       = /^(\d{1,2})(?:st|nd|rd|th)?$/i
const YEAR_RE      = /^20\d{2}$/
const NUMERIC_RE   = /^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{4}|\d{2}))?$/
const GLUED_RE     = /^(\d{1,2})(?:st|nd|rd|th)?[-\/.]?([a-z]{3,9})\.?(?:[-\/.]?(20\d{2}))?$/i
const DAY_RANGE_RE = /^(\d{1,2})-(\d{1,2})$/
const COUNT_RE     = /^\d{1,3}$/
const LETTER_RE    = /[a-z\u0080-￿]/i

// ── Dates ────────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date())
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

/** 2026-10-12 → "12 Oct 2026" */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return `${day} ${MONTH_LABELS[month - 1]} ${year}`
}

/** Returns null for dates that do not exist, such as 31 Feb. */
function toISO(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day))
  const real =
    date.getUTCFullYear() === year &&
    date.getUTCMonth()    === month - 1 &&
    date.getUTCDate()     === day
  return real ? date.toISOString().slice(0, 10) : null
}

/** Without a year, picks the first occurrence on or after notBefore. */
function resolveDate(spec: DateSpec, notBefore: string): string | null {
  if (spec.year !== null) return toISO(spec.year, spec.month, spec.day)

  const year      = Number(notBefore.slice(0, 4))
  const candidate = toISO(year, spec.month, spec.day)
  if (candidate && candidate >= notBefore) return candidate
  return toISO(year + 1, spec.month, spec.day)
}

function resolveDates(
  specs: DateSpec[],
  today: string,
): { checkIn: string | null; checkOut: string | null } {
  const checkIn  = specs[0] ? resolveDate(specs[0], today) : null
  const checkOut = specs[1] ? resolveDate(specs[1], checkIn ? addDays(checkIn, 1) : today) : null
  return { checkIn, checkOut }
}

// ── Spelling tolerance ───────────────────────────────────────────────────────

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return row[b.length]
}

function matchCommandWord(word: string, fuzzy: boolean): CommandWord | null {
  const w     = word.toLowerCase()
  const exact = COMMAND_WORDS.find(c => c === w) ?? COMMAND_ALIASES[w]
  if (exact) return exact
  if (!fuzzy || w.length < 3) return null
  return COMMAND_WORDS.find(c => editDistance(w, c) === 1) ?? null
}

/** Exact month name or its 3-letter short form. */
function isMonthWord(word: string): boolean {
  const w = word.toLowerCase()
  return MONTHS.some(full => w === full || w === full.slice(0, 3)) || w === 'sept'
}

/** Month number (1–12) for a month name, a shortened name, or a near-miss spelling. */
function matchMonth(word: string | undefined): number | null {
  if (!word) return null
  const w = word.toLowerCase().replace(/\.$/, '')
  if (w.length < 3 || !/^[a-z]+$/.test(w)) return null

  const prefix = MONTHS.findIndex(full => full.startsWith(w))
  if (prefix !== -1) return prefix + 1
  if (w.length < 4) return null

  let best: number | null = null
  let bestDistance = Infinity
  MONTHS.forEach((full, i) => {
    const allowed  = full.length <= 5 ? 1 : 2
    const distance = editDistance(w, full)
    if (distance <= allowed && distance < bestDistance) {
      best         = i + 1
      bestDistance = distance
    }
  })
  return best
}

function isRoomWord(word: string): boolean {
  const w = word.toLowerCase()
  return /^(rooms?|rms?)$/.test(w) || (w.length >= 4 && editDistance(w, 'rooms') <= 1)
}

function isGuestWord(word: string): boolean {
  const w = word.toLowerCase()
  return /^(guests?|people|persons?|pax|adults?|members?)$/.test(w)
    || (w.length >= 5 && editDistance(w, 'guests') <= 1)
}

// ── Tokens ───────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .replace(/[–—]/g, ' - ')
    .replace(/([a-z])-(\d{1,2})(?!\d)/gi, '$1 - $2')   // "12 Oct-15 Oct"
    .split(/[\s,;]+/)
    .filter(Boolean)
}

function readDay(token: string | undefined): number | null {
  const match = token?.match(DAY_RE)
  if (!match) return null
  const day = Number(match[1])
  return day >= 1 && day <= 31 ? day : null
}

function readYear(token: string | undefined): number | null {
  return token && YEAR_RE.test(token) ? Number(token) : null
}

/** "12 to 15 Oct" — the start day takes its month from the end date. */
function startOfRange(day: number, end: DateSpec): DateSpec {
  if (day <= end.day) return { day, month: end.month, year: end.year }
  if (end.month > 1)  return { day, month: end.month - 1, year: end.year }
  return { day, month: 12, year: end.year === null ? null : end.year - 1 }
}

/** "12 Oct to 15" — the end day takes its month from the start date. */
function endOfRange(day: number, start: DateSpec): DateSpec {
  if (day > start.day)  return { day, month: start.month, year: start.year }
  if (start.month < 12) return { day, month: start.month + 1, year: start.year }
  return { day, month: 1, year: start.year === null ? null : start.year + 1 }
}

/**
 * Finds the dates in a token list, in the order written, and marks the
 * tokens they used. Day comes first in numeric dates (12/10 is 12 October).
 */
function extractDates(tokens: string[], used: Set<number>): DateSpec[] {
  const specs: DateSpec[]  = []
  const openDays: number[] = []   // start days still waiting for a month

  const free = (i: number) => (i >= 0 && i < tokens.length && !used.has(i) ? tokens[i] : undefined)
  const add  = (spec: DateSpec, ...indexes: number[]) => {
    for (const day of openDays.splice(0)) specs.push(startOfRange(day, spec))
    specs.push(spec)
    indexes.forEach(i => used.add(i))
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = free(i)
    if (!token) continue

    // 12-15 Oct
    const dayRange   = token.match(DAY_RANGE_RE)
    const rangeMonth = dayRange ? matchMonth(free(i + 1)) : null
    if (dayRange && rangeMonth) {
      const year = readYear(free(i + 2))
      openDays.push(Number(dayRange[1]))
      add({ day: Number(dayRange[2]), month: rangeMonth, year }, i, i + 1, ...(year ? [i + 2] : []))
      continue
    }

    // 12/10 or 12/10/2026
    const numeric = token.match(NUMERIC_RE)
    if (numeric) {
      const day   = Number(numeric[1])
      const month = Number(numeric[2])
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : null
        add({ day, month, year }, i)
        continue
      }
    }

    // 12oct or 12-Oct-2026
    const glued      = token.match(GLUED_RE)
    const gluedMonth = glued ? matchMonth(glued[2]) : null
    if (glued && gluedMonth && Number(glued[1]) >= 1 && Number(glued[1]) <= 31) {
      const nextYear = glued[3] ? null : readYear(free(i + 1))
      const year     = glued[3] ? Number(glued[3]) : nextYear
      add({ day: Number(glued[1]), month: gluedMonth, year }, i, ...(nextYear ? [i + 1] : []))
      continue
    }

    const day = readDay(token)
    if (day !== null) {
      // 12 Oct or 12 Oct 2026
      const month = matchMonth(free(i + 1))
      if (month) {
        const year = readYear(free(i + 2))
        add({ day, month, year }, i, i + 1, ...(year ? [i + 2] : []))
        continue
      }

      // 12 to 15 Oct — month comes from the date that follows
      const connector = free(i + 1)
      if (
        connector && RANGE_WORDS.has(connector.toLowerCase()) &&
        readDay(free(i + 2)) !== null && matchMonth(free(i + 3))
      ) {
        openDays.push(day)
        used.add(i)
        continue
      }

      // 12 Oct to 15 — month comes from the date before
      const before = tokens[i - 1]
      if (specs.length > 0 && before && RANGE_WORDS.has(before.toLowerCase())) {
        add(endOfRange(day, specs[specs.length - 1]), i)
      }
      continue
    }

    // Oct 12 or Oct 12 2026 — unless the day belongs to a following "12 Oct"
    const month   = matchMonth(token)
    const nextDay = readDay(free(i + 1))
    if (month && nextDay !== null && !matchMonth(free(i + 2))) {
      const year = readYear(free(i + 2))
      add({ day: nextDay, month, year }, i, i + 1, ...(year ? [i + 2] : []))
    }
  }

  return specs
}

/** Finds "2 rooms", "2rooms" or "rooms 2" and marks the tokens it used. */
function extractCount(
  tokens: string[],
  used:   Set<number>,
  isUnit: (word: string) => boolean,
): number | null {
  const unit = (i: number) => !used.has(i) && isUnit(tokens[i].replace(/:$/, ''))
  const take = (value: string, ...indexes: number[]) => {
    indexes.forEach(i => used.add(i))
    return Number(value) > 0 ? Number(value) : null
  }

  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue
    const glued = tokens[i].match(/^(\d{1,3})([a-z]+)$/i)
    if (glued && isUnit(glued[2])) return take(glued[1], i)
    if (COUNT_RE.test(tokens[i]) && i + 1 < tokens.length && unit(i + 1)) return take(tokens[i], i, i + 1)
  }

  for (let i = 0; i + 1 < tokens.length; i++) {
    if (unit(i) && !used.has(i + 1) && COUNT_RE.test(tokens[i + 1])) return take(tokens[i + 1], i, i + 1)
  }

  return null
}

function cleanName(raw: string): string | null {
  const name = raw
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z\u0080-￿]+|[^a-z\u0080-￿.]+$/gi, '')
    .slice(0, 80)
    .trim()
  return LETTER_RE.test(name) ? name : null
}

// ── Commands ─────────────────────────────────────────────────────────────────

function parseBookingDraft(text: string, today: string): BookingDraft {
  const tokens = tokenize(text)
  const used   = new Set<number>()

  const rooms  = extractCount(tokens, used, isRoomWord)
  const guests = extractCount(tokens, used, isGuestWord)
  const dates  = resolveDates(extractDates(tokens, used), today)

  // Whatever is left, minus filler words and stray numbers, is the guest name
  const hasDigit   = (t: string | undefined) => !!t && /\d/.test(t)
  const nameTokens = tokens.filter((token, i) => {
    if (used.has(i) || hasDigit(token))           return false
    if (CONNECTORS.has(token.toLowerCase()))      return false
    if (isRoomWord(token) || isGuestWord(token))  return false
    if (isMonthWord(token) && (hasDigit(tokens[i - 1]) || hasDigit(tokens[i + 1]))) return false
    return true
  })

  return {
    guestName: cleanName(nameTokens.join(' ')),
    checkIn:   dates.checkIn,
    checkOut:  dates.checkOut,
    rooms,
    guests,
  }
}

/**
 * Reads a message into a command. With fuzzy on, a command word that is one
 * letter off ("bok", "chek") is still recognised.
 */
export function parseCommand(text: string, fuzzy: boolean): Command {
  const trimmed = text.trim()
  const first   = trimmed.match(/^[a-z]+/i)?.[0] ?? ''
  const rest    = trimmed.slice(first.length)
  const today   = todayISO()

  switch (matchCommandWord(first, fuzzy)) {
    case 'book':
      return { kind: 'book', draft: parseBookingDraft(rest, today) }
    case 'check':
      return { kind: 'check', ...resolveDates(extractDates(tokenize(rest), new Set()), today) }
    case 'list':
      return { kind: 'list' }
    case 'rooms':
      return { kind: 'rooms', count: parseCountAnswer(rest) }
    case 'cancel': {
      const match = rest.match(/\d+/)
      return { kind: 'cancel', bookingNo: match ? Number(match[0]) : null }
    }
    default:
      return { kind: 'unknown' }
  }
}

// ── Answers to follow-up questions ───────────────────────────────────────────

/** A date typed on its own. A bare day ("15") means the next such day on or after notBefore. */
export function parseDateAnswer(text: string, notBefore: string): string | null {
  const specs = extractDates(tokenize(text), new Set())
  if (specs[0]) return resolveDate(specs[0], notBefore)

  const day = readDay(text.trim())
  if (day === null) return null
  for (let offset = 0; offset < 62; offset++) {
    const candidate = addDays(notBefore, offset)
    if (Number(candidate.slice(8)) === day) return candidate
  }
  return null
}

/** A count typed as digits ("3", "3 rooms") or as a word ("three"). */
export function parseCountAnswer(text: string): number | null {
  const digits = text.match(/\d+/)
  if (digits) {
    const count = Number(digits[0])
    return count >= 1 && count <= 999 ? count : null
  }
  const word = text.trim().toLowerCase().split(/\s+/)[0]
  return NUMBER_WORDS[word] ?? null
}

export function parseNameAnswer(text: string): string | null {
  return cleanName(text)
}
