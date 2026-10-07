// The conversation with a host: decides the reply to each message.
//
// messageReader turns the message into a structured request; this file checks
// it, asks for whatever is missing, asks for a Yes before anything is saved,
// and only then calls bookingService. Every reply about a result is written
// here, after the booking service has returned.

import { getPendingAction, setPendingAction } from './identityService'
import type { MatchedHomestay } from './hostMatcher'
import type { Intent } from './intents'
import { readMessage, type HostRequest, type DateRange, type ListKind } from './messageReader'
import {
  parseStayAnswer, parseCountAnswer, parseNameAnswer,
  todayISO, addDays, nightsBetween, formatDate, formatDayMonth,
  type BookingDraft, type DateQuestion,
} from './commandParser'
import {
  getTotalRooms, setTotalRooms, getBookedRooms, createBooking, getBooking,
  listUpcomingBookings, listBookingsInRange, updateBooking, cancelBooking,
  type Booking, type BookingUpdate,
} from './bookingService'

export interface ReplyButton {
  id:    string
  title: string
}

export interface ReplyRow {
  id:           string
  title:        string
  description?: string
}

export interface AssistantReply {
  text:     string
  buttons?: ReplyButton[]                            // up to three, tappable
  list?:    { button: string; rows: ReplyRow[] }     // a tappable menu of up to ten rows
}

interface Context {
  identityId: string
  homestay:   MatchedHomestay
}

type CreateField = 'guestName' | 'checkIn' | 'checkOut' | 'guests'
type ChangeStep  = 'what' | 'dates' | 'checkOut' | 'guests' | 'phone' | 'name' | 'note' | 'confirm'
type Topic       = 'availability' | 'who' | 'find' | 'rooms'

/** A new booking still being completed, or waiting for a Yes. */
interface PendingCreate {
  type:       'create'
  homestayId: string
  draft:      BookingDraft
  phone:      string | null
  notes:      string | null
  step:       CreateField | 'confirm'
}

/** Several bookings matched; waiting for the host to choose one. */
interface PendingPick {
  type:       'pick'
  homestayId: string
  purpose:    'change' | 'cancel'
  bookingNos: number[]
  request:    HostRequest   // what the host asked for, to carry on with after the choice
}

/** A change to a saved booking: still being worked out, or waiting for a Yes. */
interface PendingChange {
  type:       'change'
  homestayId: string
  bookingNo:  number
  step:       ChangeStep
  update:     BookingUpdate | null
}

/** A cancellation waiting for a Yes. */
interface PendingCancel {
  type:       'cancel'
  homestayId: string
  bookingNo:  number
}

/** A question asked after a menu tap, waiting for its answer. */
interface PendingAsk {
  type:       'ask'
  homestayId: string
  about:      Topic
}

type Pending = PendingCreate | PendingPick | PendingChange | PendingCancel | PendingAsk

const PENDING_MAX_AGE_MINUTES = 30
const MAX_NIGHTS              = 365
const LIST_LIMIT              = 10
const SEARCH_LIMIT            = 200

const PENDING_TYPES = new Set(['create', 'pick', 'change', 'cancel', 'ask'])

const CREATE_ORDER: CreateField[] = ['guestName', 'checkIn', 'checkOut', 'guests']

// A message with one of these intents but no guest named is a correction to
// whatever is in progress, not a new request
const CORRECTION_INTENTS = new Set<Intent>([
  'create', 'move', 'change', 'extend', 'shorten', 'checkout', 'guests', 'details',
])

const YES_WORDS = new Set([
  'yes', 'y', 'ya', 'yeah', 'yep', 'ok', 'okay', 'sure', 'confirm', 'save', 'done',
  'haan', 'yes please', 'go ahead', 'proceed', 'add it', 'yes add it',
])
const NO_WORDS = new Set([
  'no', 'n', 'nope', 'nahi', 'no thanks', 'dont', 'discard', 'cancel', 'stop',
])

const YES_NO: ReplyButton[] = [
  { id: 'yes', title: 'Yes' },
  { id: 'no',  title: 'No' },
]

const WHO_BUTTONS: ReplyButton[] = [
  { id: 'who_today',    title: 'Today' },
  { id: 'who_tomorrow', title: 'Tomorrow' },
  { id: 'who_week',     title: 'This week' },
]

const CHANGE_BUTTONS: ReplyButton[] = [
  { id: 'change_dates',  title: 'Change dates' },
  { id: 'change_guests', title: 'Change guests' },
  { id: 'change_cancel', title: 'Cancel booking' },
]

const MENU_ROWS: ReplyRow[] = [
  { id: 'menu_add',    title: 'Add booking',        description: 'Or type: Book Rahul 12 to 14 Oct, 3 guests' },
  { id: 'menu_check',  title: 'Check availability', description: 'Or type: Is this weekend free?' },
  { id: 'menu_who',    title: 'Who is coming',      description: 'Or type: Who is coming tomorrow?' },
  { id: 'menu_find',   title: 'Find a booking',     description: "Or type: Show Rahul's booking" },
  { id: 'menu_change', title: 'Change a booking',   description: 'Or type: Move Rahul to 15 to 17 Oct' },
  { id: 'menu_cancel', title: 'Cancel a booking',   description: "Or type: Cancel Rahul's booking" },
  { id: 'menu_rooms',  title: 'Set room count',     description: 'Or type: ROOMS 3' },
]

const DATES_EXAMPLE = '(example: 12 Oct, or 12 Oct to 15 Oct)'
const STOP_HINT     = 'To stop, send: forget it'

const remember = (ctx: Context, pending: Pending) => setPendingAction(ctx.identityId, pending)
const forget   = (ctx: Context) => setPendingAction(ctx.identityId, null)

// ── Wording ──────────────────────────────────────────────────────────────────

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** "12 Oct 2026 to 15 Oct 2026 (3 nights)" */
function describeStay(checkIn: string, checkOut: string): string {
  const nights = nightsBetween(checkIn, checkOut)
  return `${formatDate(checkIn)} to ${formatDate(checkOut)} (${plural(nights, 'night')})`
}

/** "12 Oct to 15 Oct" */
function shortStay(checkIn: string, checkOut: string): string {
  return `${formatDayMonth(checkIn)} to ${formatDayMonth(checkOut)}`
}

function bookingLine(b: Booking): string {
  return `#${b.booking_no} ${b.guest_name}, ${shortStay(b.check_in, b.check_out)}, ${plural(b.guests, 'guest')}, ${plural(b.rooms, 'room')}`
}

/** The booking line, plus its status, phone and note when it has them. */
function bookingDetails(b: Booking): string {
  const lines = [bookingLine(b) + (b.status === 'cancelled' ? ' (cancelled)' : '')]
  if (b.guest_phone) lines.push(`   Phone: ${b.guest_phone}`)
  if (b.notes)       lines.push(`   Note: ${b.notes}`)
  return lines.join('\n')
}

function namesMatch(a: string, b: string): boolean {
  const x = a.trim().toLowerCase()
  const y = b.trim().toLowerCase()
  return x.includes(y) || y.includes(x)
}

function menuReply(homestay: MatchedHomestay, lead?: string): AssistantReply {
  return {
    text: lead ?? `Hello ${homestay.host_name}! What would you like to do for "${homestay.title}"?`,
    list: { button: 'Menu', rows: MENU_ROWS },
  }
}

function dateButtons(question: DateQuestion): ReplyButton[] {
  return question.options.slice(0, 3).map((title, i) => ({ id: `date_${i}`, title }))
}

function stopText(pending: Pending): string {
  if (pending.type === 'create') return "Okay, I haven't added the booking."
  if (pending.type === 'ask')    return 'Okay.'
  return 'Okay, nothing was changed.'
}

// ── Room count ───────────────────────────────────────────────────────────────

async function askRoomCount(ctx: Context): Promise<AssistantReply> {
  const total = await getTotalRooms(ctx.homestay.id)
  await remember(ctx, { type: 'ask', homestayId: ctx.homestay.id, about: 'rooms' })

  const title = ctx.homestay.title
  return {
    text: total === null
      ? `First tell me how many rooms "${title}" has in total. Send a number, for example: 3`
      : `"${title}" has ${plural(total, 'room')} in total. Send the new number to change it, or send: forget it`,
  }
}

async function setRoomCount(ctx: Context, count: number): Promise<AssistantReply> {
  await setTotalRooms(ctx.homestay.id, count)
  return { text: `"${ctx.homestay.title}" now has ${plural(count, 'room')} in total.` }
}

// ── Add a booking ────────────────────────────────────────────────────────────

const CREATE_QUESTIONS: Record<CreateField, string> = {
  guestName: 'What is the guest name?',
  checkIn:   'What is the check-in date? (example: 12 Oct, or 12 Oct to 14 Oct)',
  checkOut:  'What is the check-out date? (example: 14 Oct, or 3 nights)',
  guests:    'How many guests will be staying?',
}

/** "Got it: Rahul, 12 Oct to 14 Oct, 3 guests." — or nothing, when nothing is known yet. */
function knownSoFar(draft: BookingDraft): string {
  const parts: string[] = []
  if (draft.guestName) parts.push(draft.guestName)

  if (draft.checkIn && draft.checkOut) parts.push(shortStay(draft.checkIn, draft.checkOut))
  else if (draft.checkIn)              parts.push(`from ${formatDayMonth(draft.checkIn)}`)

  if (draft.guests !== null) parts.push(plural(draft.guests, 'guest'))
  if (draft.rooms  !== null) parts.push(plural(draft.rooms, 'room'))

  return parts.length > 0 ? `Got it: ${parts.join(', ')}.` : ''
}

function draftFrom(request: HostRequest): BookingDraft {
  const [checkIn = null, second = null] = request.dates
  return {
    guestName: request.guestName,
    checkIn,
    checkOut:  second ?? (checkIn && request.nights !== null ? addDays(checkIn, request.nights) : null),
    rooms:     request.rooms,
    guests:    request.guests,
  }
}

/** Asks for the next missing detail, or shows the booking for a Yes when it is complete. */
async function continueCreate(
  ctx:      Context,
  input:    BookingDraft,
  extras:   { phone: string | null; notes: string | null },
  question: DateQuestion | null = null,
): Promise<AssistantReply> {
  const { homestay } = ctx

  const total = await getTotalRooms(homestay.id)
  if (total === null) return askRoomCount(ctx)

  const draft = { ...input }
  let note = ''

  if (draft.checkIn && draft.checkOut) {
    if (draft.checkOut <= draft.checkIn) {
      draft.checkOut = null
      note = 'The check-out date must be after the check-in date.'
    } else if (nightsBetween(draft.checkIn, draft.checkOut) > MAX_NIGHTS) {
      draft.checkOut = null
      note = 'That stay is longer than a year.'
    }
  }

  const missing = CREATE_ORDER.find(field => draft[field] === null)
  if (missing) {
    await remember(ctx, { type: 'create', homestayId: homestay.id, draft, ...extras, step: missing })

    const unclear = question && missing === 'checkIn' ? question : null
    const text    = [note, knownSoFar(draft), unclear?.text ?? CREATE_QUESTIONS[missing]]
      .filter(Boolean)
      .join('\n')
    return unclear ? { text, buttons: dateButtons(unclear) } : { text }
  }

  const guestName = draft.guestName as string
  const checkIn   = draft.checkIn as string
  const checkOut  = draft.checkOut as string
  const guests    = draft.guests as number
  const rooms     = draft.rooms ?? 1
  const stay      = describeStay(checkIn, checkOut)

  const booked = await getBookedRooms(homestay.id, checkIn, checkOut)
  const free   = Math.max(total - booked, 0)
  if (rooms > free) {
    await forget(ctx)
    return {
      text: free === 0
        ? `${guestName} can't be booked for ${stay}: those dates are fully booked. I haven't added the booking.`
        : `${guestName} can't be booked for ${stay}: only ${free} of ${plural(total, 'room')} ${free === 1 ? 'is' : 'are'} free. I haven't added the booking.`,
    }
  }

  const upcoming = await listUpcomingBookings(homestay.id, todayISO(), SEARCH_LIMIT)
  const similar  = upcoming.find(b =>
    namesMatch(b.guest_name, guestName) && b.check_in < checkOut && b.check_out > checkIn,
  )

  await remember(ctx, {
    type: 'create', homestayId: homestay.id, draft: { ...draft, rooms }, ...extras, step: 'confirm',
  })

  const lines = [guestName, stay, `${plural(guests, 'guest')}, ${plural(rooms, 'room')}`]
  if (extras.phone) lines.push(`Phone: ${extras.phone}`)
  if (extras.notes) lines.push(`Note: ${extras.notes}`)
  lines.push('')
  if (similar) {
    lines.push(
      `${similar.guest_name} already has a booking for ${shortStay(similar.check_in, similar.check_out)}.`,
      'The dates are available. Add this as another booking?',
    )
  } else {
    lines.push('The dates are available. Should I add this booking?')
  }

  return { text: lines.join('\n'), buttons: YES_NO }
}

/** Saves the booking the host has just said Yes to. */
async function saveBooking(ctx: Context, pending: PendingCreate): Promise<AssistantReply> {
  const { homestay } = ctx
  const { guestName, checkIn, checkOut, guests, rooms } = pending.draft
  await forget(ctx)

  if (!guestName || !checkIn || !checkOut || guests === null || rooms === null) {
    return { text: 'That booking was incomplete, so I have not added it. Please send it again.' }
  }

  // Rooms may have been taken since the question was asked
  const total = await getTotalRooms(homestay.id)
  if (total === null) return askRoomCount(ctx)

  const free = Math.max(total - await getBookedRooms(homestay.id, checkIn, checkOut), 0)
  if (rooms > free) {
    return { text: `Those dates are no longer free: ${free} of ${plural(total, 'room')} left. I haven't added the booking.` }
  }

  const bookingNo = await createBooking({
    homestayId: homestay.id,
    identityId: ctx.identityId,
    guestName, checkIn, checkOut, rooms, guests,
    guestPhone: pending.phone,
    notes:      pending.notes,
  })

  return {
    text: `Done 👍 ${guestName}'s booking has been added.\n`
      + `#${bookingNo} ${guestName}, ${describeStay(checkIn, checkOut)}, ${plural(guests, 'guest')}, ${plural(rooms, 'room')}`,
  }
}

/** Reads a reply given while a new booking is in progress: an answer, a correction, or a Yes. */
async function answerCreate(
  ctx:     Context,
  pending: PendingCreate,
  text:    string,
  request: HostRequest,
  yes:     boolean,
): Promise<AssistantReply> {
  if (pending.step === 'confirm' && yes) return saveBooking(ctx, pending)

  const draft  = { ...pending.draft }
  const extras = { phone: request.phone ?? pending.phone, notes: request.note ?? pending.notes }
  const before = JSON.stringify([draft, extras])

  // Anything stated with its unit is taken, whatever was asked: "sorry, 5 guests"
  if (request.rooms  !== null) draft.rooms  = request.rooms
  if (request.guests !== null) draft.guests = request.guests
  if (request.newName)         draft.guestName = request.newName

  // Dates: a pair replaces both; one date answers the question that was asked
  if (request.dates.length >= 2) {
    draft.checkIn  = request.dates[0]
    draft.checkOut = request.dates[1]
  } else if (pending.step === 'checkOut' && draft.checkIn) {
    draft.checkOut = parseStayAnswer(text, addDays(draft.checkIn, 1)).checkIn ?? draft.checkOut
  } else if (request.dates.length === 1 || pending.step === 'checkIn') {
    const checkIn = request.dates[0] ?? parseStayAnswer(text, todayISO()).checkIn
    if (checkIn) {
      draft.checkIn = checkIn
      if (draft.checkOut && draft.checkOut <= checkIn) draft.checkOut = null
    }
  }
  if (request.nights !== null && draft.checkIn && (pending.step === 'checkOut' || draft.checkOut === null)) {
    draft.checkOut = addDays(draft.checkIn, request.nights)
  }

  // A bare answer to the question that was asked: "4", "Rahul Patil"
  const bare = request.dates.length === 0 && request.nights === null
  if (pending.step === 'guests' && draft.guests === null && bare) {
    draft.guests = parseCountAnswer(text)
  }
  if (pending.step === 'guestName' && draft.guestName === null) {
    const plain = bare && request.guests === null && request.rooms === null
    draft.guestName = plain ? parseNameAnswer(text) : request.guestName
  }

  if (pending.step !== 'confirm' && JSON.stringify([draft, extras]) === before) {
    return { text: `Sorry, I could not read that. ${CREATE_QUESTIONS[pending.step]}\n${STOP_HINT}` }
  }

  return continueCreate(ctx, draft, extras)
}

// ── Availability ─────────────────────────────────────────────────────────────

async function availabilityReply(ctx: Context, checkIn: string, checkOut: string): Promise<AssistantReply> {
  if (checkOut <= checkIn || nightsBetween(checkIn, checkOut) > MAX_NIGHTS) {
    return { text: 'The check-out date must be after the check-in date, and within a year of it.' }
  }

  const total = await getTotalRooms(ctx.homestay.id)
  if (total === null) return askRoomCount(ctx)

  const booked = await getBookedRooms(ctx.homestay.id, checkIn, checkOut)
  const free   = Math.max(total - booked, 0)
  const stay   = describeStay(checkIn, checkOut)

  if (free === 0) return { text: `${stay}: fully booked. 0 of ${plural(total, 'room')} free.` }
  return { text: `${stay}: available. ${free} of ${plural(total, 'room')} free.` }
}

async function startAvailability(ctx: Context, request: HostRequest): Promise<AssistantReply> {
  const [checkIn, checkOut] = request.dates
  if (checkIn) {
    return availabilityReply(ctx, checkIn, checkOut ?? addDays(checkIn, request.nights ?? 1))
  }

  await remember(ctx, { type: 'ask', homestayId: ctx.homestay.id, about: 'availability' })
  if (request.dateQuestion) {
    return { text: request.dateQuestion.text, buttons: dateButtons(request.dateQuestion) }
  }
  return { text: `Which dates? ${DATES_EXAMPLE}` }
}

// ── Lists and search ─────────────────────────────────────────────────────────

/** Check-ins or check-outs for some days, or all upcoming bookings when no days are given. */
async function listReply(ctx: Context, kind: ListKind, range: DateRange | null): Promise<AssistantReply> {
  const { homestay } = ctx

  if (kind === 'next' || range === null) {
    const upcoming = await listUpcomingBookings(homestay.id, todayISO(), LIST_LIMIT + 1)
    if (upcoming.length === 0) return { text: `No upcoming bookings for "${homestay.title}".` }
    if (kind === 'next')       return { text: `Your next booking:\n${bookingDetails(upcoming[0])}` }

    const lines = upcoming.slice(0, LIST_LIMIT).map(bookingLine)
    if (upcoming.length > LIST_LIMIT) lines.push(`Only the next ${LIST_LIMIT} are shown.`)
    return { text: [`Upcoming bookings for "${homestay.title}":`, ...lines].join('\n') }
  }

  const inRange = await listBookingsInRange(homestay.id, range.from, range.to)
  const oneDay  = addDays(range.from, 1) === range.to
  const when    = oneDay && range.label !== formatDate(range.from)
    ? `${range.label} (${formatDate(range.from)})`
    : range.label

  const leaving = kind === 'departures'
  const shown   = inRange.filter(b => {
    const day = leaving ? b.check_out : b.check_in
    return day >= range.from && day < range.to
  })
  const staying = inRange.filter(b => b.check_in < range.from && b.check_out > range.from)
  const heading = leaving ? 'check-outs' : 'check-ins'

  const lines: string[] = []
  if (shown.length === 0) {
    lines.push(`${when}: no ${heading}.`)
  } else {
    lines.push(`${when}, ${heading}:`)
    for (const b of shown.slice(0, 2 * LIST_LIMIT)) {
      const guests = plural(b.guests, 'guest')
      if (!oneDay)      lines.push(`• ${shortStay(b.check_in, b.check_out)}: ${b.guest_name}, ${guests}`)
      else if (leaving) lines.push(`• ${b.guest_name}, ${guests}, since ${formatDayMonth(b.check_in)}`)
      else              lines.push(`• ${b.guest_name}, ${guests}, until ${formatDayMonth(b.check_out)}`)
    }
    const totalGuests = shown.reduce((sum, b) => sum + b.guests, 0)
    lines.push(`Total: ${plural(shown.length, 'booking')}, ${plural(totalGuests, 'guest')}`)
  }

  if (!leaving && staying.length > 0) {
    const names = staying.map(b => `${b.guest_name} (until ${formatDayMonth(b.check_out)})`)
    lines.push(`Already staying: ${names.join(', ')}`)
  }

  return { text: lines.join('\n') }
}

async function findReply(ctx: Context, name: string): Promise<AssistantReply> {
  const upcoming = await listUpcomingBookings(ctx.homestay.id, todayISO(), SEARCH_LIMIT, true)
  const found    = upcoming.filter(b => namesMatch(b.guest_name, name))

  if (found.length === 0) return { text: `No upcoming booking found for "${name}".` }

  const heading = found.length === 1 ? `${found[0].guest_name}'s booking:` : `Bookings for "${name}":`
  return { text: [heading, ...found.slice(0, LIST_LIMIT).map(bookingDetails)].join('\n') }
}

async function startFind(ctx: Context, request: HostRequest): Promise<AssistantReply> {
  if (request.guestName) return findReply(ctx, request.guestName)
  if (request.listRange) return listReply(ctx, request.listKind, request.listRange)

  await remember(ctx, { type: 'ask', homestayId: ctx.homestay.id, about: 'find' })
  return { text: 'Which guest name?' }
}

// ── Choosing the booking a request is about ──────────────────────────────────

/**
 * The upcoming bookings a request could mean. A date in the message narrows
 * the choice only when useDates is set: in a cancellation the date says which
 * booking, in a change it is the new date.
 */
async function candidates(ctx: Context, request: HostRequest, useDates: boolean): Promise<Booking[]> {
  if (request.bookingNo !== null) {
    const booking = await getBooking(ctx.homestay.id, request.bookingNo)
    return booking ? [booking] : []
  }

  const guestName = request.guestName
  let found = await listUpcomingBookings(ctx.homestay.id, todayISO(), SEARCH_LIMIT)
  if (guestName) found = found.filter(b => namesMatch(b.guest_name, guestName))

  const date = request.dates[0]
  if (useDates && date && found.length > 1) {
    const onDate = found.filter(b => b.check_in <= date && date < b.check_out)
    if (onDate.length > 0) found = onDate
  }

  return found
}

/** Shows several bookings as a tappable list and waits for the host to choose one. */
async function pickReply(
  ctx:      Context,
  bookings: Booking[],
  purpose:  'change' | 'cancel',
  request:  HostRequest,
  lead:     string,
): Promise<AssistantReply> {
  const shown = bookings.slice(0, LIST_LIMIT)
  await remember(ctx, {
    type: 'pick', homestayId: ctx.homestay.id, purpose, bookingNos: shown.map(b => b.booking_no), request,
  })

  const more = bookings.length > shown.length
    ? `\nOnly the first ${LIST_LIMIT} are shown. Type the guest name to narrow it down.`
    : ''

  return {
    text: lead + more,
    list: {
      button: 'Bookings',
      // The check-in date in the title tells two bookings of one guest apart;
      // a row title holds 24 characters
      rows:   shown.map(b => {
        const date = ` ${formatDayMonth(b.check_in)}`
        return {
          id:          `pick_${b.booking_no}`,
          title:       b.guest_name.slice(0, 24 - date.length) + date,
          description: `${shortStay(b.check_in, b.check_out)}, ${plural(b.guests, 'guest')}, ${plural(b.rooms, 'room')}`,
        }
      }),
    },
  }
}

/** Carries on with the one booking found, asks which when there are several, or says there is none. */
async function selectBooking(
  ctx:     Context,
  found:   Booking[],
  purpose: 'change' | 'cancel',
  request: HostRequest,
): Promise<AssistantReply> {
  const title = ctx.homestay.title

  if (found.length === 0) {
    if (request.bookingNo !== null) return { text: `No active booking #${request.bookingNo} was found for "${title}".` }
    if (request.guestName)          return { text: `No upcoming booking found for "${request.guestName}".` }
    return { text: `There are no upcoming bookings for "${title}".` }
  }

  if (found.length === 1) {
    return purpose === 'cancel' ? confirmCancel(ctx, found[0]) : changeBooking(ctx, found[0], request)
  }

  const lead = request.guestName
    ? `I found ${found.length} bookings for ${request.guestName}. Which one?`
    : `Which booking would you like to ${purpose}?`
  return pickReply(ctx, found, purpose, request, lead)
}

async function answerPick(
  ctx:     Context,
  pending: PendingPick,
  text:    string,
  tapId:   string | null,
  request: HostRequest,
): Promise<AssistantReply> {
  const loaded  = await Promise.all(pending.bookingNos.map(no => getBooking(ctx.homestay.id, no)))
  const options = loaded.filter((b): b is Booking => b !== null)

  if (options.length === 0) {
    await forget(ctx)
    return { text: 'Those bookings are no longer active. Nothing was changed.' }
  }

  const tapped = tapId?.match(/^pick_(\d+)$/) ?? text.match(/(\d+)/)
  let chosen   = tapped ? options.find(b => b.booking_no === Number(tapped[1])) : undefined

  if (!chosen) {
    const name   = request.guestName ?? parseNameAnswer(text)
    const byName = name ? options.filter(b => namesMatch(b.guest_name, name)) : []
    if (byName.length === 1) chosen = byName[0]
  }

  if (!chosen) {
    return pickReply(ctx, options, pending.purpose, pending.request, `Please choose one of these bookings.\n${STOP_HINT}`)
  }

  return pending.purpose === 'cancel'
    ? confirmCancel(ctx, chosen)
    : changeBooking(ctx, chosen, pending.request)
}

// ── Cancel a booking ─────────────────────────────────────────────────────────

async function confirmCancel(ctx: Context, booking: Booking): Promise<AssistantReply> {
  await remember(ctx, { type: 'cancel', homestayId: ctx.homestay.id, bookingNo: booking.booking_no })
  return { text: `Cancel this booking?\n${bookingLine(booking)}`, buttons: YES_NO }
}

async function applyCancel(ctx: Context, pending: PendingCancel): Promise<AssistantReply> {
  await forget(ctx)

  const cancelled = await cancelBooking(ctx.homestay.id, pending.bookingNo)
  if (!cancelled) {
    return { text: 'That booking could not be found, or is already cancelled. Nothing was changed.' }
  }

  return {
    text: `Done. ${cancelled.guest_name}'s booking for ${shortStay(cancelled.check_in, cancelled.check_out)} has been cancelled.`,
  }
}

// ── Change a booking ─────────────────────────────────────────────────────────

async function askChange(
  ctx:      Context,
  booking:  Booking,
  step:     ChangeStep,
  text:     string,
  buttons?: ReplyButton[],
): Promise<AssistantReply> {
  await remember(ctx, {
    type: 'change', homestayId: ctx.homestay.id, bookingNo: booking.booking_no, step, update: null,
  })
  return buttons ? { text, buttons } : { text }
}

/** Why the booking cannot take these dates, or null when it can. */
async function datesProblem(
  ctx:      Context,
  booking:  Booking,
  checkIn:  string,
  checkOut: string,
): Promise<string | null> {
  const total = await getTotalRooms(ctx.homestay.id)
  if (total === null) return null

  const booked = await getBookedRooms(ctx.homestay.id, checkIn, checkOut, booking.booking_no)
  const free   = Math.max(total - booked, 0)
  if (booking.rooms <= free) return null

  const stay = describeStay(checkIn, checkOut)
  return free === 0
    ? `${stay} is fully booked.`
    : `Only ${free} of ${plural(total, 'room')} ${free === 1 ? 'is' : 'are'} free for ${stay}, and this booking needs ${plural(booking.rooms, 'room')}.`
}

/** Checks a change and, if it can be made, shows it for a Yes. */
async function proposeChange(ctx: Context, booking: Booking, update: BookingUpdate): Promise<AssistantReply> {
  const name    = booking.guest_name
  const current = `${name}'s current booking is ${shortStay(booking.check_in, booking.check_out)}.`
  const lines: string[] = []

  if (update.checkIn !== undefined || update.checkOut !== undefined) {
    const checkIn  = update.checkIn  ?? booking.check_in
    const checkOut = update.checkOut ?? booking.check_out

    let problem: string | null = null
    if (checkOut <= checkIn || nightsBetween(checkIn, checkOut) > MAX_NIGHTS) {
      problem = 'The check-out date must be after the check-in date, and within a year of it.'
    } else if (checkIn === booking.check_in && checkOut === booking.check_out) {
      problem = 'Those are the same dates as now.'
    } else {
      problem = await datesProblem(ctx, booking, checkIn, checkOut)
    }

    if (problem) {
      await forget(ctx)
      return { text: `${current}\n${problem}\nNothing was changed.` }
    }

    lines.push(current, `${describeStay(checkIn, checkOut)} is available.`, `Change it to ${shortStay(checkIn, checkOut)}?`)
  }

  if (update.guests !== undefined) {
    if (update.guests === booking.guests) {
      await forget(ctx)
      return { text: `${name}'s booking already has ${plural(booking.guests, 'guest')}. Nothing was changed.` }
    }
    lines.push(`Change ${name}'s booking (${shortStay(booking.check_in, booking.check_out)}) from ${plural(booking.guests, 'guest')} to ${plural(update.guests, 'guest')}?`)
  }

  if (update.guestName  !== undefined) lines.push(`Rename ${name}'s booking to "${update.guestName}"?`)
  if (update.guestPhone !== undefined) lines.push(`Set the phone number for ${name}'s booking to ${update.guestPhone}?`)
  if (update.notes      !== undefined) lines.push(`Add this note to ${name}'s booking?\n"${update.notes}"`)

  await remember(ctx, {
    type: 'change', homestayId: ctx.homestay.id, bookingNo: booking.booking_no, step: 'confirm', update,
  })
  return { text: lines.join('\n'), buttons: YES_NO }
}

/** Makes the change the host has just said Yes to. */
async function applyChange(ctx: Context, booking: Booking, update: BookingUpdate): Promise<AssistantReply> {
  await forget(ctx)

  // Rooms may have been taken since the question was asked
  if (update.checkIn !== undefined || update.checkOut !== undefined) {
    const problem = await datesProblem(
      ctx, booking, update.checkIn ?? booking.check_in, update.checkOut ?? booking.check_out,
    )
    if (problem) return { text: `${problem}\nNothing was changed.` }
  }

  const updated = await updateBooking(ctx.homestay.id, booking.booking_no, update)
  if (!updated) {
    return { text: 'That booking could not be found, or is already cancelled. Nothing was changed.' }
  }

  return { text: `Done 👍 ${updated.guest_name}'s booking is now:\n${bookingDetails(updated)}` }
}

/** Works out the change a request asks for on one booking, or asks for what is missing. */
async function changeBooking(ctx: Context, booking: Booking, request: HostRequest): Promise<AssistantReply> {
  const name   = booking.guest_name
  const stay   = shortStay(booking.check_in, booking.check_out)
  const nights = nightsBetween(booking.check_in, booking.check_out)

  switch (request.intent) {
    case 'move': {
      const [checkIn, checkOut] = request.dates.slice(-2)
      if (checkIn) {
        return proposeChange(ctx, booking, {
          checkIn,
          checkOut: checkOut ?? addDays(checkIn, request.nights ?? nights),
        })
      }
      if (request.dateQuestion) {
        return askChange(ctx, booking, 'dates', request.dateQuestion.text, dateButtons(request.dateQuestion))
      }
      return askChange(ctx, booking, 'dates', `${name}'s current booking is ${stay}. What are the new dates? (example: 15 Oct to 17 Oct)`)
    }

    case 'extend':
    case 'shorten':
    case 'checkout': {
      if (request.nightsChange !== null) {
        return proposeChange(ctx, booking, { checkOut: addDays(booking.check_out, request.nightsChange) })
      }

      // "until Monday" means the Monday after the stay it changes, not this week's
      const after    = request.intent === 'extend' ? booking.check_out : booking.check_in
      const checkOut = request.dates.length > 0 ? parseStayAnswer(request.text, addDays(after, 1)).checkIn : null
      if (checkOut) return proposeChange(ctx, booking, { checkOut })

      if (request.dateQuestion) {
        return askChange(ctx, booking, 'checkOut', request.dateQuestion.text, dateButtons(request.dateQuestion))
      }
      return askChange(ctx, booking, 'checkOut', `${name}'s current booking is ${stay}. What should the new check-out date be? (example: 15 Oct)`)
    }

    case 'guests': {
      const guests = request.guests
        ?? (request.guestsChange !== null ? booking.guests + request.guestsChange : null)

      if (guests === null) {
        return askChange(ctx, booking, 'guests', `${name}'s booking (${stay}) has ${plural(booking.guests, 'guest')}. How many guests should it be?`)
      }
      if (guests < 1) {
        await forget(ctx)
        return { text: `A booking needs at least 1 guest. To cancel it instead, send: Cancel ${name}'s booking` }
      }
      return proposeChange(ctx, booking, { guests })
    }

    case 'details': {
      const update: BookingUpdate = {}
      if (request.newName) update.guestName  = request.newName
      if (request.phone)   update.guestPhone = request.phone
      if (request.note)    update.notes      = request.note
      if (Object.keys(update).length > 0) return proposeChange(ctx, booking, update)

      const lower = request.text.toLowerCase()
      if (/phone|mobile|number/.test(lower)) return askChange(ctx, booking, 'phone', `What is the phone number for ${name}?`)
      if (/note/.test(lower))                return askChange(ctx, booking, 'note', `What note should I add to ${name}'s booking?`)
      if (/name/.test(lower))                return askChange(ctx, booking, 'name', `What should the name on ${name}'s booking be?`)
      return askChange(ctx, booking, 'what', `${bookingLine(booking)}\nWhat would you like to change?`, CHANGE_BUTTONS)
    }

    default:
      return askChange(ctx, booking, 'what', `${bookingLine(booking)}\nWhat would you like to change?`, CHANGE_BUTTONS)
  }
}

/** Reads a reply given while a change is in progress. */
async function answerChange(
  ctx:     Context,
  pending: PendingChange,
  text:    string,
  tapId:   string | null,
  request: HostRequest,
  yes:     boolean,
): Promise<AssistantReply> {
  const booking = await getBooking(ctx.homestay.id, pending.bookingNo)
  if (!booking) {
    await forget(ctx)
    return { text: 'That booking is no longer active. Nothing was changed.' }
  }

  const name  = booking.guest_name
  const lower = text.toLowerCase()
  const retry = (step: ChangeStep, question: string) =>
    askChange(ctx, booking, step, `Sorry, I could not read that. ${question}\n${STOP_HINT}`)

  switch (pending.step) {
    case 'confirm':
      if (!pending.update) return changeBooking(ctx, booking, request)
      return yes ? applyChange(ctx, booking, pending.update) : proposeChange(ctx, booking, pending.update)

    case 'what':
      if (tapId === 'change_dates'  || /date/.test(lower))         return askChange(ctx, booking, 'dates', `What are the new dates for ${name}? (example: 15 Oct to 17 Oct)`)
      if (tapId === 'change_guests' || /guest|people/.test(lower)) return askChange(ctx, booking, 'guests', `How many guests should ${name}'s booking have?`)
      if (tapId === 'change_cancel' || /cancel/.test(lower))       return confirmCancel(ctx, booking)
      return askChange(ctx, booking, 'what', 'Please choose what to change.', CHANGE_BUTTONS)

    case 'dates': {
      const stay = parseStayAnswer(text, todayISO())
      if (!stay.checkIn) return retry('dates', 'What are the new dates? (example: 15 Oct to 17 Oct)')

      const nights = request.nights ?? nightsBetween(booking.check_in, booking.check_out)
      return proposeChange(ctx, booking, {
        checkIn:  stay.checkIn,
        checkOut: stay.checkOut ?? addDays(stay.checkIn, nights),
      })
    }

    case 'checkOut': {
      if (request.nightsChange !== null) {
        return proposeChange(ctx, booking, { checkOut: addDays(booking.check_out, request.nightsChange) })
      }
      const checkOut = parseStayAnswer(text, addDays(booking.check_in, 1)).checkIn
      if (!checkOut) return retry('checkOut', 'What should the new check-out date be? (example: 15 Oct)')
      return proposeChange(ctx, booking, { checkOut })
    }

    case 'guests': {
      const guests = request.guests ?? parseCountAnswer(text)
      if (guests === null) return retry('guests', 'How many guests should it be?')
      return proposeChange(ctx, booking, { guests })
    }

    case 'phone': {
      const phone = request.phone ?? text.replace(/[^\d+]/g, '')
      if (phone.replace(/\D/g, '').length < 7) return retry('phone', `What is the phone number for ${name}?`)
      return proposeChange(ctx, booking, { guestPhone: phone })
    }

    case 'name': {
      const guestName = request.newName ?? parseNameAnswer(text)
      if (!guestName) return retry('name', `What should the name on ${name}'s booking be?`)
      return proposeChange(ctx, booking, { guestName })
    }

    case 'note': {
      const notes = (request.note ?? text).trim()
      if (!notes) return retry('note', `What note should I add to ${name}'s booking?`)
      return proposeChange(ctx, booking, { notes })
    }
  }
}

// ── Questions asked after a menu tap ─────────────────────────────────────────

async function answerAsk(
  ctx:     Context,
  pending: PendingAsk,
  text:    string,
  request: HostRequest,
): Promise<AssistantReply> {
  switch (pending.about) {
    case 'availability': {
      const stay = parseStayAnswer(text, todayISO())
      if (!stay.checkIn) {
        return { text: `Sorry, I could not read the dates. Which dates? ${DATES_EXAMPLE}\n${STOP_HINT}` }
      }
      await forget(ctx)
      return availabilityReply(ctx, stay.checkIn, stay.checkOut ?? addDays(stay.checkIn, request.nights ?? 1))
    }

    case 'who': {
      if (!request.listRange) return { text: 'For which day?', buttons: WHO_BUTTONS }
      await forget(ctx)
      return listReply(ctx, request.listKind, request.listRange)
    }

    case 'find': {
      const name = request.guestName ?? parseNameAnswer(text)
      if (!name) return { text: `Sorry, I could not read that. Which guest name?\n${STOP_HINT}` }
      await forget(ctx)
      return findReply(ctx, name)
    }

    case 'rooms': {
      const count = parseCountAnswer(text)
      if (count === null) return { text: `Please send the number of rooms, for example: 3\n${STOP_HINT}` }
      await forget(ctx)
      return setRoomCount(ctx, count)
    }
  }
}

// ── Menu taps ────────────────────────────────────────────────────────────────

async function startFromMenu(ctx: Context, tapId: string): Promise<AssistantReply> {
  const homestayId = ctx.homestay.id
  const blank      = readMessage('')

  switch (tapId) {
    case 'menu_add':
      return continueCreate(
        ctx,
        { guestName: null, checkIn: null, checkOut: null, rooms: null, guests: null },
        { phone: null, notes: null },
      )

    case 'menu_check':
      await remember(ctx, { type: 'ask', homestayId, about: 'availability' })
      return { text: `Which dates? ${DATES_EXAMPLE}` }

    case 'menu_who':
      await remember(ctx, { type: 'ask', homestayId, about: 'who' })
      return { text: 'For which day?', buttons: WHO_BUTTONS }

    case 'menu_find':
      await remember(ctx, { type: 'ask', homestayId, about: 'find' })
      return { text: 'Which guest name?' }

    case 'menu_change':
      return selectBooking(ctx, await candidates(ctx, blank, false), 'change', blank)

    case 'menu_cancel':
      return selectBooking(ctx, await candidates(ctx, blank, false), 'cancel', blank)

    case 'menu_rooms':
      return askRoomCount(ctx)

    default:
      return menuReply(ctx.homestay)
  }
}

// ── Routing ──────────────────────────────────────────────────────────────────

/** Starts whatever a new request asks for. */
async function handleRequest(ctx: Context, request: HostRequest): Promise<AssistantReply> {
  switch (request.intent) {
    case 'create':
      return continueCreate(ctx, draftFrom(request), { phone: request.phone, notes: request.note }, request.dateQuestion)

    case 'availability':
      return startAvailability(ctx, request)

    case 'list':
      return listReply(ctx, request.listKind, request.listRange)

    case 'find':
      return startFind(ctx, request)

    case 'cancel':
      return selectBooking(ctx, await candidates(ctx, request, true), 'cancel', request)

    case 'move':
    case 'extend':
    case 'shorten':
    case 'checkout':
    case 'guests':
    case 'details':
    case 'change':
      return selectBooking(ctx, await candidates(ctx, request, false), 'change', request)

    case 'rooms':
      return request.rooms !== null ? setRoomCount(ctx, request.rooms) : askRoomCount(ctx)

    case 'stop':
      return { text: "There is nothing in progress. To cancel a saved booking, send for example: Cancel Rahul's booking" }

    case 'menu':
      return menuReply(ctx.homestay)

    default:
      // A name with dates and nothing else, "Rahul 12 to 14 Oct", is a booking
      if (request.guestName && request.dates.length > 0) {
        return continueCreate(ctx, draftFrom(request), { phone: request.phone, notes: request.note })
      }
      console.log('[WhatsApp] not understood —', request.text)
      return menuReply(ctx.homestay, `Sorry, I did not understand that. What would you like to do for "${ctx.homestay.title}"?`)
  }
}

/** Reads a reply to whatever the assistant last asked. */
async function answerPending(
  ctx:     Context,
  pending: Pending,
  text:    string,
  tapId:   string | null,
  request: HostRequest,
  yes:     boolean,
): Promise<AssistantReply> {
  switch (pending.type) {
    case 'create': return answerCreate(ctx, pending, text, request, yes)
    case 'pick':   return answerPick(ctx, pending, text, tapId, request)
    case 'change': return answerChange(ctx, pending, text, tapId, request, yes)
    case 'ask':    return answerAsk(ctx, pending, text, request)
    case 'cancel':
      if (yes) return applyCancel(ctx, pending)
      return { text: 'Please reply Yes to cancel the booking, or No to keep it.', buttons: YES_NO }
  }
}

async function converse(
  ctx:   Context,
  text:  string,
  tapId: string | null,
): Promise<AssistantReply> {
  const stored  = await getPendingAction<Pending>(ctx.identityId, PENDING_MAX_AGE_MINUTES)
  const pending = stored && stored.homestayId === ctx.homestay.id && PENDING_TYPES.has(stored.type)
    ? stored
    : null

  // A tap on the main menu always starts afresh
  if (tapId?.startsWith('menu_')) {
    if (pending) await forget(ctx)
    return startFromMenu(ctx, tapId)
  }

  const said = text.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
  const yes  = tapId === 'yes' || YES_WORDS.has(said)
  const no   = tapId === 'no'  || NO_WORDS.has(said)

  // While a question is open, an answer must not be read as a misspelt command
  const request = readMessage(text, !pending)

  if (!pending) {
    if (request.intent === null && (yes || no)) {
      return menuReply(ctx.homestay, `There is nothing waiting for an answer. What would you like to do for "${ctx.homestay.title}"?`)
    }
    return handleRequest(ctx, request)
  }

  if (no || request.intent === 'stop') {
    await forget(ctx)
    return { text: stopText(pending) }
  }

  // A typed request that names a guest, or asks for something else entirely,
  // replaces what was in progress. A tap is always an answer.
  const correction = request.intent !== null
    && CORRECTION_INTENTS.has(request.intent)
    && request.guestName === null
    && request.bookingNo === null
  const interrupts = tapId === null && request.intent !== null && !correction

  if (!interrupts) return answerPending(ctx, pending, text, tapId, request, yes)

  await forget(ctx)
  return handleRequest(ctx, request)
}

// ── Entry point ──────────────────────────────────────────────────────────────

/**
 * Decides the reply to a message, given the homestays the sender's number
 * matches. tapId is the id of the button or menu row the host tapped, if any.
 * Bookings work only when exactly one homestay matches.
 */
export async function handleHostMessage(
  identityId: string,
  matches:    MatchedHomestay[],
  text:       string,
  tapId:      string | null = null,
): Promise<AssistantReply> {
  if (matches.length === 0) {
    return { text: 'This number is not registered with any BeNative homestay. To list your stay, visit benative.in/list-your-stay' }
  }

  if (matches.length > 1) {
    const titles = matches.map(m => m.title).join(', ')
    return {
      text: `Hello ${matches[0].host_name}! This number is registered for ${matches.length} homestays on BeNative: ${titles}.\n`
        + 'Bookings by WhatsApp are not available yet for a number linked to more than one homestay.',
    }
  }

  const ctx: Context = { identityId, homestay: matches[0] }

  try {
    return await converse(ctx, text, tapId)
  } catch (err) {
    // Every write is the last step of its flow, so a failure here means nothing was saved
    console.error('[WhatsApp assistant] failed —', err instanceof Error ? err.message : err)
    try {
      await forget(ctx)
    } catch {
      // the stored step expires on its own
    }
    return { text: "Sorry, I couldn't do that right now. Nothing has been changed. Please try again." }
  }
}
