// Text toolkit for the WhatsApp assistant: reads dates, counts and names out of
// a host's message. Fixed rules only — no AI — but tolerant of small spelling
// mistakes in month names and command words.

export interface BookingDraft {
  guestName: string | null
  checkIn:   string | null   // YYYY-MM-DD
  checkOut:  string | null   // YYYY-MM-DD, the departure day
  rooms:     number | null
  guests:    number | null
}

/** A date phrase with two possible meanings, to be put to the host. */
export interface DateQuestion {
  text:    string     // "Do you mean Friday 9 Oct or Friday 16 Oct?"
  options: string[]   // button titles, each readable by parseStayAnswer
}

export interface ExtractedDates {
  dates:    string[]              // YYYY-MM-DD, in the order written
  question: DateQuestion | null   // set when a phrase such as "next Friday" is unclear
}

type DateSpec =
  | { kind: 'date';    day: number; month: number; year: number | null }   // 12 Oct
  | { kind: 'day';     day: number }                                       // "12th", no month
  | { kind: 'weekday'; weekday: number }                                   // 0 = Sunday
  | { kind: 'iso';     iso: string }                                       // today, tomorrow

type FullDate = Extract<DateSpec, { kind: 'date' }>

const TIME_ZONE = 'Asia/Kolkata'
const SATURDAY  = 6

const COMMAND_WORDS = ['book', 'check', 'list', 'rooms', 'cancel'] as const
export type CommandWord = typeof COMMAND_WORDS[number]

const COMMAND_ALIASES = new Map<string, CommandWord>([
  ['booking',  'book'],
  ['bookings', 'list'],
  ['room',     'rooms'],
])

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const WEEKDAY_LABELS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

const WEEKDAYS = new Map<string, number>([
  ['sunday', 0], ['sun', 0],
  ['monday', 1], ['mon', 1],
  ['tuesday', 2], ['tue', 2], ['tues', 2],
  ['wednesday', 3], ['wed', 3],
  ['thursday', 4], ['thu', 4], ['thur', 4], ['thurs', 4],
  ['friday', 5], ['fri', 5],
  ['saturday', 6], ['sat', 6],
])

const NUMBER_WORDS = new Map<string, number>([
  ['one', 1], ['two', 2], ['three', 3], ['four', 4], ['five', 5], ['six', 6],
  ['seven', 7], ['eight', 8], ['nine', 9], ['ten', 10], ['eleven', 11], ['twelve', 12],
])

const TODAY_WORDS    = new Set(['today', 'tonight'])
const TOMORROW_WORDS = new Set(['tomorrow', 'tmrw', 'tmr', 'tomorow', 'tommorow', 'tommorrow'])
const RANGE_WORDS    = new Set(['to', 'till', 'until', 'upto', '-'])

const DAY_RE       = /^(\d{1,2})(?:st|nd|rd|th)?$/i
const ORDINAL_RE   = /^\d{1,2}(?:st|nd|rd|th)$/i
const YEAR_RE      = /^20\d{2}$/
const NUMERIC_RE   = /^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{4}|\d{2}))?$/
const GLUED_RE     = /^(\d{1,2})(?:st|nd|rd|th)?[-\/.]?([a-z]{3,9})\.?(?:[-\/.]?(20\d{2}))?$/i
const DAY_RANGE_RE = /^(\d{1,2})-(\d{1,2})$/
const COUNT_RE     = /^\d{1,3}$/

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

/** 2026-10-12 → "12 Oct" */
export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split('-').map(Number)
  return `${day} ${MONTH_LABELS[month - 1]}`
}

function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay()
}

/** 2026-10-12 → "Monday" */
export function weekdayLabel(iso: string): string {
  return WEEKDAY_LABELS[weekdayOf(iso)]
}

/** First date on or after `from` that falls on the given weekday. */
function nextWeekday(from: string, weekday: number): string {
  let date = from
  while (weekdayOf(date) !== weekday) date = addDays(date, 1)
  return date
}

/** "17-19 Oct", or "31 Oct-2 Nov" across a month end. */
function rangeTitle(from: string, to: string): string {
  const [, fromMonth, fromDay] = from.split('-').map(Number)
  const [, toMonth, toDay]     = to.split('-').map(Number)
  return fromMonth === toMonth
    ? `${fromDay}-${toDay} ${MONTH_LABELS[toMonth - 1]}`
    : `${fromDay} ${MONTH_LABELS[fromMonth - 1]}-${toDay} ${MONTH_LABELS[toMonth - 1]}`
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

/** Turns what the host wrote into a date: the first one on or after notBefore. */
function resolveDate(spec: DateSpec, notBefore: string): string | null {
  switch (spec.kind) {
    case 'iso':
      return spec.iso

    case 'weekday':
      return nextWeekday(notBefore, spec.weekday)

    case 'day':
      for (let offset = 0; offset < 62; offset++) {
        const candidate = addDays(notBefore, offset)
        if (Number(candidate.slice(8)) === spec.day) return candidate
      }
      return null

    case 'date': {
      if (spec.year !== null) return toISO(spec.year, spec.month, spec.day)

      const year      = Number(notBefore.slice(0, 4))
      const candidate = toISO(year, spec.month, spec.day)
      if (candidate && candidate >= notBefore) return candidate
      return toISO(year + 1, spec.month, spec.day)
    }
  }
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

/**
 * The fixed command a word stands for, if any. With fuzzy on, a word that is
 * one letter off ("bok", "chek") is still recognised.
 */
export function matchCommandWord(word: string, fuzzy: boolean): CommandWord | null {
  const w     = word.toLowerCase()
  const exact = COMMAND_WORDS.find(c => c === w) ?? COMMAND_ALIASES.get(w)
  if (exact) return exact
  if (!fuzzy || w.length < 3) return null
  return COMMAND_WORDS.find(c => editDistance(w, c) === 1) ?? null
}

/** Exact month name or its 3-letter short form. */
export function isMonthWord(word: string): boolean {
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

export function isRoomWord(word: string): boolean {
  const w = word.toLowerCase()
  return /^(rooms?|rms?)$/.test(w) || (w.length >= 4 && editDistance(w, 'rooms') <= 1)
}

export function isGuestWord(word: string): boolean {
  const w = word.toLowerCase()
  return /^(guests?|people|persons?|pax|adults?|members?)$/.test(w)
    || (w.length >= 5 && editDistance(w, 'guests') <= 1)
}

export function isNightWord(word: string): boolean {
  return /^(nights?|days?)$/i.test(word)
}

// ── Tokens ───────────────────────────────────────────────────────────────────

/** Splits a message into words, dropping punctuation and possessive 's. */
export function tokenize(text: string): string[] {
  return text
    .replace(/[–—]/g, ' - ')
    .replace(/[‘’]/g, "'")
    .replace(/([a-z])-(\d{1,2})(?!\d)/gi, '$1 - $2')   // "12 Oct-15 Oct"
    .split(/[\s,;]+/)
    .map(token => token
      .replace(/^["'(\[]+/, '')
      .replace(/[?!.:)"\]]+$/, '')
      .replace(/'s$/i, '')
      .replace(/'+$/, ''))
    .filter(Boolean)
}

/** A count written as digits ("3") or as a word ("three"). */
export function readCount(token: string | undefined): number | null {
  if (!token) return null
  if (COUNT_RE.test(token)) return Number(token)
  return NUMBER_WORDS.get(token.toLowerCase()) ?? null
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
function startOfRange(day: number, end: FullDate): FullDate {
  if (day <= end.day) return { kind: 'date', day, month: end.month, year: end.year }
  if (end.month > 1)  return { kind: 'date', day, month: end.month - 1, year: end.year }
  return { kind: 'date', day, month: 12, year: end.year === null ? null : end.year - 1 }
}

/** "12 Oct to 15" — the end day takes its month from the start date. */
function endOfRange(day: number, start: FullDate): FullDate {
  if (day > start.day)  return { kind: 'date', day, month: start.month, year: start.year }
  if (start.month < 12) return { kind: 'date', day, month: start.month + 1, year: start.year }
  return { kind: 'date', day, month: 1, year: start.year === null ? null : start.year + 1 }
}

/**
 * Finds the dates in a token list, in the order written, and marks the
 * tokens they used. Day comes first in numeric dates (12/10 is 12 October).
 *
 * Words such as "today" count from `today`. A date written without a year is
 * the first one on or after `notBefore`; the second date of a pair is the
 * first one after the first.
 */
export function extractDates(
  tokens:    string[],
  used:      Set<number>,
  today:     string,
  notBefore: string = today,
): ExtractedDates {
  const specs: DateSpec[]  = []
  const openDays: number[] = []   // start days still waiting for a month
  let question: DateQuestion | null = null

  const free  = (i: number) => (i >= 0 && i < tokens.length && !used.has(i) ? tokens[i] : undefined)
  const lower = (i: number) => free(i)?.toLowerCase()

  // Once a phrase is unclear, later dates are dropped too: the host is asked again
  const add = (spec: DateSpec, ...indexes: number[]) => {
    indexes.forEach(i => used.add(i))
    if (question) return
    for (const day of openDays.splice(0)) {
      specs.push(spec.kind === 'date' ? startOfRange(day, spec) : { kind: 'day', day })
    }
    specs.push(spec)
  }
  const ask = (unclear: DateQuestion, ...indexes: number[]) => {
    indexes.forEach(i => used.add(i))
    question = question ?? unclear
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = free(i)
    if (!token) continue
    const word = token.toLowerCase()

    // today, tomorrow, day after tomorrow
    if (TODAY_WORDS.has(word)) {
      add({ kind: 'iso', iso: today }, i)
      continue
    }
    if (TOMORROW_WORDS.has(word)) {
      add({ kind: 'iso', iso: addDays(today, 1) }, i)
      continue
    }
    if (word === 'day' && lower(i + 1) === 'after' && TOMORROW_WORDS.has(lower(i + 2) ?? '')) {
      add({ kind: 'iso', iso: addDays(today, 2) }, i, i + 1, i + 2)
      continue
    }

    // Friday, this Friday, next Friday, this weekend, next weekend
    const prefixed = word === 'next' || word === 'this' || word === 'coming'
    const dayWord  = prefixed ? lower(i + 1) : word
    const indexes  = prefixed ? [i, i + 1] : [i]
    const weekday  = dayWord === undefined ? undefined : WEEKDAYS.get(dayWord)

    if (dayWord === 'weekend') {
      if (word === 'next') {
        const first  = nextWeekday(addDays(today, 1), SATURDAY)
        const second = addDays(first, 7)
        const titles = [rangeTitle(first, addDays(first, 2)), rangeTitle(second, addDays(second, 2))]
        ask({ text: `Which weekend do you mean: ${titles[0]} or ${titles[1]}?`, options: titles }, ...indexes)
      } else {
        // Saturday to Monday: the nights of Saturday and Sunday
        const saturday = nextWeekday(today, SATURDAY)
        add({ kind: 'iso', iso: saturday }, ...indexes)
        add({ kind: 'iso', iso: addDays(saturday, 2) })
      }
      continue
    }

    if (weekday !== undefined) {
      if (word === 'next') {
        const first  = nextWeekday(addDays(today, 1), weekday)
        const second = addDays(first, 7)
        const name   = WEEKDAY_LABELS[weekday]
        ask({
          text:    `Do you mean ${name} ${formatDayMonth(first)} or ${name} ${formatDayMonth(second)}?`,
          options: [formatDate(first), formatDate(second)],
        }, ...indexes)
      } else {
        add({ kind: 'weekday', weekday }, ...indexes)
      }
      continue
    }

    // 12-15 Oct
    const dayRange   = token.match(DAY_RANGE_RE)
    const rangeMonth = dayRange ? matchMonth(free(i + 1)) : null
    if (dayRange && rangeMonth) {
      const year = readYear(free(i + 2))
      openDays.push(Number(dayRange[1]))
      add({ kind: 'date', day: Number(dayRange[2]), month: rangeMonth, year }, i, i + 1, ...(year ? [i + 2] : []))
      continue
    }

    // 12/10 or 12/10/2026
    const numeric = token.match(NUMERIC_RE)
    if (numeric) {
      const day   = Number(numeric[1])
      const month = Number(numeric[2])
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : null
        add({ kind: 'date', day, month, year }, i)
        continue
      }
    }

    // 12-14 with no month at all
    if (dayRange) {
      const first  = Number(dayRange[1])
      const second = Number(dayRange[2])
      if (first >= 1 && first <= 31 && second >= 1 && second <= 31) {
        add({ kind: 'day', day: first }, i)
        add({ kind: 'day', day: second })
        continue
      }
    }

    // 12oct or 12-Oct-2026
    const glued      = token.match(GLUED_RE)
    const gluedMonth = glued ? matchMonth(glued[2]) : null
    if (glued && gluedMonth && Number(glued[1]) >= 1 && Number(glued[1]) <= 31) {
      const nextYear = glued[3] ? null : readYear(free(i + 1))
      const year     = glued[3] ? Number(glued[3]) : nextYear
      add({ kind: 'date', day: Number(glued[1]), month: gluedMonth, year }, i, ...(nextYear ? [i + 1] : []))
      continue
    }

    const day = readDay(token)
    if (day !== null) {
      // 12 Oct or 12 Oct 2026
      const month = matchMonth(free(i + 1))
      if (month) {
        const year = readYear(free(i + 2))
        add({ kind: 'date', day, month, year }, i, i + 1, ...(year ? [i + 2] : []))
        continue
      }

      const connector  = lower(i + 1)
      const rangeAhead = connector !== undefined && RANGE_WORDS.has(connector) && readDay(free(i + 2)) !== null

      // 12 to 15 Oct — month comes from the date that follows
      if (rangeAhead && matchMonth(free(i + 3))) {
        openDays.push(day)
        used.add(i)
        continue
      }

      // 12 Oct to 15 — month comes from the date before
      const before   = tokens[i - 1]?.toLowerCase()
      const previous = specs[specs.length - 1]
      if (previous && before !== undefined && RANGE_WORDS.has(before)) {
        add(previous.kind === 'date' ? endOfRange(day, previous) : { kind: 'day', day }, i)
        continue
      }

      // 12 to 14, or 12th, with no month at all
      if (rangeAhead || ORDINAL_RE.test(token)) add({ kind: 'day', day }, i)
      continue
    }

    // Oct 12 or Oct 12 2026 — unless the day belongs to a following "12 Oct"
    const month   = matchMonth(token)
    const nextDay = readDay(free(i + 1))
    if (month && nextDay !== null && !matchMonth(free(i + 2))) {
      const year = readYear(free(i + 2))
      add({ kind: 'date', day: nextDay, month, year }, i, i + 1, ...(year ? [i + 2] : []))
    }
  }

  // Dates come in pairs: the second of each pair follows the first
  const dates: string[] = []
  for (let i = 0; i < specs.length; i++) {
    const floor = i % 2 === 1 ? addDays(dates[i - 1], 1) : notBefore
    const iso   = resolveDate(specs[i], floor)
    if (!iso) break
    dates.push(iso)
  }

  return { dates, question }
}

/** Finds "2 rooms", "2rooms", "two rooms" or "rooms 2" and marks the tokens it used. */
export function extractCount(
  tokens: string[],
  used:   Set<number>,
  isUnit: (word: string) => boolean,
): number | null {
  const unit = (i: number) => !used.has(i) && isUnit(tokens[i])
  const take = (value: number, ...indexes: number[]) => {
    indexes.forEach(i => used.add(i))
    return value > 0 ? value : null
  }

  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue
    const glued = tokens[i].match(/^(\d{1,3})([a-z]+)$/i)
    if (glued && isUnit(glued[2])) return take(Number(glued[1]), i)

    const count = readCount(tokens[i])
    if (count !== null && i + 1 < tokens.length && unit(i + 1)) return take(count, i, i + 1)
  }

  for (let i = 0; i + 1 < tokens.length; i++) {
    const count = used.has(i + 1) ? null : readCount(tokens[i + 1])
    if (unit(i) && count !== null) return take(count, i, i + 1)
  }

  return null
}

/** True for a-z and for any character outside basic Latin, so names in other scripts are kept. */
function isNameChar(char: string): boolean {
  return /[a-z]/i.test(char) || char.charCodeAt(0) > 127
}

/** Trims a name to its letters; null if nothing name-like is left. */
export function cleanName(raw: string): string | null {
  const chars = raw.replace(/\s+/g, ' ').split('')

  let start = 0
  let end   = chars.length
  while (start < end && !isNameChar(chars[start])) start++
  while (end > start && !isNameChar(chars[end - 1]) && chars[end - 1] !== '.') end--

  // A full stop is kept after an initial or a title ("R.", "Mr."), not after a whole word
  const name = chars.slice(start, end).join('').slice(0, 80).trim().replace(/([a-z]{3})\.$/i, '$1')
  return name.length > 0 ? name : null
}

// ── Answers to follow-up questions ───────────────────────────────────────────

/**
 * A date or a pair of dates typed on their own: "12 Oct", "12 to 14 Oct",
 * "tomorrow", "Sunday". A bare day ("15") means the next such day on or
 * after notBefore.
 */
export function parseStayAnswer(
  text:      string,
  notBefore: string,
): { checkIn: string | null; checkOut: string | null } {
  const tokens    = tokenize(text)
  const { dates } = extractDates(tokens, new Set(), todayISO(), notBefore)
  if (dates.length > 0) return { checkIn: dates[0], checkOut: dates[1] ?? null }

  const day = tokens.length === 1 ? readDay(tokens[0]) : null
  if (day === null) return { checkIn: null, checkOut: null }
  return { checkIn: resolveDate({ kind: 'day', day }, notBefore), checkOut: null }
}

/** A count typed as digits ("3", "3 rooms") or as a word ("three"). */
export function parseCountAnswer(text: string): number | null {
  const digits = text.match(/\d+/)
  if (digits) {
    const count = Number(digits[0])
    return count >= 1 && count <= 999 ? count : null
  }
  return readCount(text.trim().split(/\s+/)[0])
}

export function parseNameAnswer(text: string): string | null {
  return cleanName(text)
}

/** An amount of money typed on its own: "2000", "2,000", "2k", "Rs 2000". */
export function parseAmountAnswer(text: string): number | null {
  const match = text.match(/(\d[\d,]*(?:\.\d{1,2})?)\s*(k\b)?/i)
  return match ? toAmount(match[1], match[2]) : null
}

/** "5,000" → 5000, "5" with a k → 5000. Null when zero or too large to store. */
export function toAmount(digits: string, thousands: string | undefined): number | null {
  const amount = Number(digits.replace(/,/g, '')) * (thousands ? 1000 : 1)
  return amount > 0 && amount < 100_000_000 ? amount : null
}

// ── Clock times ──────────────────────────────────────────────────────────────

const TIME_12H_RE = /\b(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i
const TIME_24H_RE = /\b(?:at|by|around)\s+([01]?\d|2[0-3]):([0-5]\d)\b/i

/**
 * Finds a clock time: "11 am", "3:30 pm", "at 14:30". An hour without am or
 * pm is not taken, because it cannot be told from a date. Returns the time as
 * HH:MM, and the text with the time removed.
 */
export function extractTime(text: string): { time: string | null; rest: string } {
  const pad = (n: number) => String(n).padStart(2, '0')

  const twelve = text.match(TIME_12H_RE)
  if (twelve) {
    const hour    = Number(twelve[1])
    const minutes = Number(twelve[2] ?? 0)
    if (hour >= 1 && hour <= 12 && minutes <= 59) {
      const isPm   = twelve[3].toLowerCase().startsWith('p')
      const hour24 = (hour % 12) + (isPm ? 12 : 0)
      return { time: `${pad(hour24)}:${pad(minutes)}`, rest: text.replace(twelve[0], ' ') }
    }
  }

  const twentyFour = text.match(TIME_24H_RE)
  if (twentyFour) {
    return {
      time: `${pad(Number(twentyFour[1]))}:${twentyFour[2]}`,
      rest: text.replace(twentyFour[0], ' '),
    }
  }

  return { time: null, rest: text }
}

/** "11:00" or "11:00:00" → "11 AM"; "15:30" → "3:30 PM" */
export function formatTime(time: string): string {
  const [hour, minutes] = time.split(':').map(Number)
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const suffix = hour < 12 ? 'AM' : 'PM'
  return minutes === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`
}
