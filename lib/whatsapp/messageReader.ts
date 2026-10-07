// Turns a host's typed message into a structured request: what they want
// (the intent) and the details found in the message. Fixed rules only — no AI.
// The words that decide the intent live in intents.ts.

import { INTENT_PHRASES, type Intent } from './intents'
import {
  tokenize, extractDates, extractCount, readCount, cleanName, matchCommandWord,
  isRoomWord, isGuestWord, isNightWord, isMonthWord,
  todayISO, addDays, formatDate,
  type DateQuestion,
} from './commandParser'

export type ListKind = 'arrivals' | 'departures' | 'next'

export interface DateRange {
  from:  string   // YYYY-MM-DD
  to:    string   // YYYY-MM-DD, not included
  label: string   // "Tomorrow", "This week", "12 Oct 2026"
}

export interface HostRequest {
  text:         string                // the message as typed
  intent:       Intent | null         // null when nothing was recognised
  guestName:    string | null
  dates:        string[]              // YYYY-MM-DD, in the order written
  dateQuestion: DateQuestion | null   // set when a phrase such as "next Friday" is unclear
  nights:       number | null         // "for 3 nights"
  nightsChange: number | null         // "one more day" → 1, "two days early" → -2
  guests:       number | null         // "4 guests"
  guestsChange: number | null         // "add two more guests" → 2
  rooms:        number | null         // "2 rooms"
  bookingNo:    number | null         // "#7"
  phone:        string | null
  note:         string | null
  newName:      string | null         // "name is actually Rahul Patil"
  listKind:     ListKind
  listRange:    DateRange | null      // null means all upcoming bookings
}

// ── Patterns ─────────────────────────────────────────────────────────────────

const GUEST_ADD_RE     = /\b(?:add|plus)\s+(\w+)\s+(?:more\s+)?(?:guests?|people|persons?|adults?|members?)\b/
const GUEST_MORE_RE    = /\b(\w+)\s+more\s+(?:guests?|people|persons?|adults?|members?)\b/
const GUEST_REMOVE_RE  = /\b(?:remove|minus)\s+(\w+)\s+(?:guests?|people|persons?|adults?|members?)\b/
const GUEST_FEWER_RE   = /\b(\w+)\s+(?:fewer|less)\s+(?:guests?|people|persons?|adults?|members?)\b/
const GUEST_FROM_TO_RE = /\bfrom\s+\w+(?:\s+(?:guests?|people|persons?|adults?|members?))?\s+to\s+(\w+)\b/
const GUEST_COUNT_RE   = /\b(\w+)\s+(?:guests?|people|persons?|pax|adults?|members?)\b/

const NIGHTS_MORE_RE  = /\b(\w+)\s+(?:more|extra)\s+(?:days?|nights?)\b/
const NIGHTS_ONE_RE   = /\b(?:another|extra)\s+(?:day|night)\b/
const NIGHTS_EARLY_RE = /\b(\w+)\s+(?:days?|nights?)\s+(?:early|earlier|less)\b/

const PHONE_RE      = /(?:^|[^\d+])((?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5})(?!\d)/
const PHONE_INTL_RE = /(\+\d[\d\s-]{8,14}\d)/

const NOTE_RE     = /\b(?:add\s+(?:a\s+)?note(?:\s+that)?|note\s+that|notes?\s*:)\s*(.+)$/i
const NEW_NAME_RE = /\bname\s+is\s+(?:actually\s+)?(.+)$/i
const RENAME_RE   = /\brename\s+(.*?)\s+to\s+(.+)$/i

const BOOKING_NO_RE    = /#\s*(\d{1,6})\b/
const LEGACY_CANCEL_RE = /^cancel\s+(\d{1,6})$/
const ROOMS_OWNED_RE   = /\b(?:i|we)\s+have\s+\w+\s+rooms?\b/
const DEPARTURES_RE    = /\b(?:checking out|check-?outs?|check outs?|departures?|leaving)\b/

// A message that starts like this is asking, not telling
const QUESTION_STARTS = new Set([
  'is', 'are', 'does', 'do', 'did', 'has', 'have', 'who', "who's", 'whos',
  'when', 'what', "what's", 'whats', 'which', 'how', 'any',
])

// ...unless it starts like this: "Can you add a booking for Sameer?"
const REQUEST_STARTS = new Set(['can', 'could', 'would', 'will', 'please', 'pls', 'kindly'])

// Words that are never part of a guest's name
const NAME_STOP_WORDS = new Set((
  'a an the i we my our me us you your he she his her him they them their it its ' +
  'is are was were be been am do does did has have had having will would shall should ' +
  'can could may might must ' +
  "isn't isnt won't wont don't dont can't cant didn't didnt " +
  'please pls plz kindly and or but with without of in at by as that this these those ' +
  'there here now then so just also again instead actually sorry ok okay hi hello hey ' +
  'yes no not ' +
  'book booking bookings booked add added new create make got get take coming come ' +
  'comes came arrive arriving arrives arrival stay staying stays stayed leave leaving ' +
  'leaves check checks checkin checkout check-in check-out checking out ' +
  'check-ins checkins check-outs checkouts ins outs arrivals departures upcoming ' +
  'cancel cancelled canceled remove delete move moved shift change changed update ' +
  'modify edit reschedule postpone prepone extend ' +
  'show find search list see tell give who what when where which how many much any ' +
  'anything anyone available availability free vacant homestay home place property ' +
  'room rooms guest guests people person persons pax adult adults member members ' +
  'night nights day days week weekend month date dates time today tonight tomorrow ' +
  'starting start from to till until upto for on - ' +
  'more less fewer extra another early earlier later longer next confirm confirmed ' +
  'status pending note notes phone mobile number contact name named rename ' +
  'reservation reserve want wants need needs like let lets set total'
).split(' '))

// ── Intent ───────────────────────────────────────────────────────────────────

/** Lower case, with punctuation removed, for matching phrases. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[^a-z0-9'#+\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasPhrase(normal: string, phrase: string): boolean {
  return ` ${normal} `.includes(` ${phrase} `)
}

/** The intent, and whether it came from a fixed command as the first word. */
function detectIntent(normal: string, fuzzy: boolean): { intent: Intent | null; fromCommand: boolean } {
  // "add two guests" and "remove one guest" are guest changes, not new bookings or cancellations
  if (GUEST_ADD_RE.test(normal) || GUEST_REMOVE_RE.test(normal)) {
    return { intent: 'guests', fromCommand: false }
  }

  for (const { intent, phrases } of INTENT_PHRASES) {
    if (phrases.some(phrase => hasPhrase(normal, phrase))) return { intent, fromCommand: false }
  }

  if (ROOMS_OWNED_RE.test(normal)) return { intent: 'rooms', fromCommand: false }

  // The fixed commands. One-letter slips ("bok", "chek") are accepted only for
  // the commands that take details after them: a lone word such as the name
  // "Lisa" must not be read as LIST.
  const first  = normal.match(/^[a-z]+/)?.[0] ?? ''
  const exact  = matchCommandWord(first, false)
  const slip   = fuzzy ? matchCommandWord(first, true) : null
  const tolerant = slip === 'book' || slip === 'check' || slip === 'cancel' ? slip : null

  switch (exact ?? tolerant) {
    case 'book':   return { intent: 'create',       fromCommand: true }
    case 'check':  return { intent: 'availability', fromCommand: true }
    case 'list':   return { intent: 'list',         fromCommand: true }
    case 'rooms':  return { intent: 'rooms',        fromCommand: true }
    case 'cancel': return { intent: 'cancel',       fromCommand: true }
    default:       return { intent: null,           fromCommand: false }
  }
}

// ── Details ──────────────────────────────────────────────────────────────────

/** A count written as digits, as a word, or as "a" / "an" / "another". */
function wordToCount(word: string): number | null {
  if (word === 'a' || word === 'an' || word === 'another') return 1
  return readCount(word)
}

/** A new guest count ("4 guests"), or a change to it ("two more guests"). */
function readGuestChange(normal: string): { guests: number | null; change: number | null } {
  const added = normal.match(GUEST_ADD_RE) ?? normal.match(GUEST_MORE_RE)
  if (added) {
    const count = wordToCount(added[1])
    return { guests: null, change: count }
  }

  const removed = normal.match(GUEST_REMOVE_RE) ?? normal.match(GUEST_FEWER_RE)
  if (removed) {
    const count = wordToCount(removed[1])
    return { guests: null, change: count === null ? null : -count }
  }

  const stated = normal.match(GUEST_FROM_TO_RE) ?? normal.match(GUEST_COUNT_RE)
  return { guests: stated ? wordToCount(stated[1]) : null, change: null }
}

/** Nights added ("one more day") or taken off ("two days early"). */
function readNightsChange(normal: string): number | null {
  const more = normal.match(NIGHTS_MORE_RE)
  if (more && wordToCount(more[1]) !== null) return wordToCount(more[1])
  if (NIGHTS_ONE_RE.test(normal)) return 1

  const early = normal.match(NIGHTS_EARLY_RE)
  const count = early ? wordToCount(early[1]) : null
  return count === null ? null : -count
}

/** The first unbroken run of words that could be a name. */
function readName(tokens: string[], used: Set<number>): string | null {
  const hasDigit = (token: string | undefined) => !!token && /\d/.test(token)
  const parts: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const skip  =
      used.has(i) || hasDigit(token) || readCount(token) !== null ||
      NAME_STOP_WORDS.has(token.toLowerCase()) ||
      isRoomWord(token) || isGuestWord(token) ||
      (isMonthWord(token) && (hasDigit(tokens[i - 1]) || hasDigit(tokens[i + 1])))

    if (!skip) parts.push(token)
    else if (parts.length > 0) break
  }

  return cleanName(parts.slice(0, 4).join(' '))
}

function firstOfNextMonth(iso: string): string {
  const [year, month] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
}

/** The first Monday after the given date. */
function nextMonday(iso: string): string {
  let date = addDays(iso, 1)
  while (new Date(`${date}T00:00:00Z`).getUTCDay() !== 1) date = addDays(date, 1)
  return date
}

/** The days a "who is coming" question is about; null means all upcoming. */
function readListRange(normal: string, dates: string[], today: string): DateRange | null {
  if (dates.length >= 2) {
    return { from: dates[0], to: addDays(dates[1], 1), label: `${formatDate(dates[0])} to ${formatDate(dates[1])}` }
  }

  if (dates.length === 1) {
    const day   = dates[0]
    const label = day === today ? 'Today' : day === addDays(today, 1) ? 'Tomorrow' : formatDate(day)
    return { from: day, to: addDays(day, 1), label }
  }

  // Patterns, not phrases, so that "this week's bookings" is read as well
  if (/\bthis week\b/.test(normal)) {
    return { from: today, to: nextMonday(today), label: 'This week' }
  }
  if (/\bnext week\b/.test(normal)) {
    const monday = nextMonday(today)
    return { from: monday, to: addDays(monday, 7), label: 'Next week' }
  }
  if (/\bthis month\b/.test(normal)) {
    return { from: today, to: firstOfNextMonth(today), label: 'This month' }
  }
  if (/\bnext month\b/.test(normal)) {
    const first = firstOfNextMonth(today)
    return { from: first, to: firstOfNextMonth(first), label: 'Next month' }
  }

  return null
}

// ── Entry point ──────────────────────────────────────────────────────────────

/**
 * Reads a message into a request. Turn fuzzy off while the host is answering
 * a question, so that an answer is not mistaken for a misspelt command.
 */
export function readMessage(text: string, fuzzy: boolean = true): HostRequest {
  const today  = todayISO()
  const normal = normalise(text)

  const detected = detectIntent(normal, fuzzy)
  let intent     = detected.intent
  let main       = text

  // A note runs to the end of the message; set it aside before reading the rest
  let note: string | null = null
  const noteMatch = main.match(NOTE_RE)
  if (noteMatch && noteMatch.index !== undefined) {
    note = noteMatch[1].trim()
    main = main.slice(0, noteMatch.index)
  }

  // So does a corrected name — but "name is ..." inside a new booking is the guest's name
  let newName: string | null = null
  if (intent !== 'create') {
    const renamed = main.match(RENAME_RE)
    const named   = renamed ? null : main.match(NEW_NAME_RE)
    if (renamed && renamed.index !== undefined) {
      newName = cleanName(renamed[2].replace(/[.!?]+$/, ''))
      main    = `${main.slice(0, renamed.index)} ${renamed[1]}`
    } else if (named && named.index !== undefined) {
      newName = cleanName(named[1].replace(/[.!?]+$/, ''))
      main    = main.slice(0, named.index)
    }
  }

  // A phone number would otherwise be read as stray numbers
  let phone: string | null = null
  const phoneMatch = main.match(PHONE_RE) ?? main.match(PHONE_INTL_RE)
  if (phoneMatch) {
    phone = phoneMatch[1].replace(/[\s-]/g, '')
    main  = main.replace(phoneMatch[1], ' ')
  }

  const tokens = tokenize(main)
  const used   = new Set<number>()

  const rooms       = extractCount(tokens, used, isRoomWord)
  const unitGuests  = extractCount(tokens, used, isGuestWord)
  const nights      = extractCount(tokens, used, isNightWord)
  const found       = extractDates(tokens, used, today)
  const guestChange = readGuestChange(normal)

  // A misspelt command word ("bok Sunil") is not part of the name
  if (detected.fromCommand) used.add(0)
  const guestName = readName(tokens, used)

  const numbered  = normal.match(BOOKING_NO_RE) ?? normal.match(LEGACY_CANCEL_RE)
  const bookingNo = numbered ? Number(numbered[1]) : null

  // "Is Rahul coming tomorrow?" asks about a booking; it does not make one
  const firstWord    = normal.split(' ')[0]
  const asksQuestion =
    QUESTION_STARTS.has(firstWord) ||
    (text.trim().endsWith('?') && !REQUEST_STARTS.has(firstWord))
  if (intent === 'create' && asksQuestion) intent = guestName ? 'find' : 'list'

  // "Change ..." on its own says nothing about what; the rest of the message does
  if (intent === 'change') {
    const hasDates = found.dates.length > 0 || found.question !== null
    if (guestChange.guests !== null || guestChange.change !== null) {
      intent = 'guests'
    } else if (!hasDates && /\b(?:phone|mobile|number|name|note)\b/.test(normal)) {
      intent = 'details'
    } else if (/\b(?:guests?|people|persons?)\b/.test(normal)) {
      intent = 'guests'
    } else if (/\bcheck-?\s?out\b/.test(normal)) {
      intent = 'checkout'
    } else if (hasDates || /\bdates?\b/.test(normal)) {
      intent = 'move'
    }
  }

  // In a guest change, "from 3 guests to 5" means 5, and "one more guest" is not a count of 1
  const guests = intent === 'guests' ? guestChange.guests : unitGuests

  const listKind: ListKind =
    hasPhrase(normal, 'next booking') ? 'next' :
    DEPARTURES_RE.test(normal)        ? 'departures' :
                                        'arrivals'

  return {
    text,
    intent,
    guestName,
    dates:        found.dates,
    dateQuestion: found.question,
    nights,
    nightsChange: readNightsChange(normal),
    guests,
    guestsChange: intent === 'guests' ? guestChange.change : null,
    rooms,
    bookingNo,
    phone,
    note,
    newName,
    listKind,
    listRange:    readListRange(normal, found.dates, today),
  }
}
