import { getPendingAction, setPendingAction } from './identityService'
import type { MatchedHomestay } from './hostMatcher'
import {
  parseCommand, parseDateAnswer, parseCountAnswer, parseNameAnswer,
  todayISO, addDays, nightsBetween, formatDate,
  type BookingDraft,
} from './commandParser'
import {
  getTotalRooms, setTotalRooms, getBookedRooms,
  createBooking, listUpcomingBookings, cancelBooking,
} from './bookingService'

export interface ReplyButton {
  id:    string
  title: string
}

export interface AssistantReply {
  text:     string
  buttons?: ReplyButton[]
}

type DraftField = keyof BookingDraft

interface CompleteDraft {
  guestName: string
  checkIn:   string
  checkOut:  string
  rooms:     number
  guests:    number
}

/** A booking the host is still completing, or has not yet confirmed. */
interface PendingBooking {
  type:       'booking'
  homestayId: string
  draft:      BookingDraft
  step:       DraftField | 'confirm'
}

const PENDING_MAX_AGE_MINUTES = 30
const MAX_NIGHTS              = 365
const LIST_LIMIT              = 10

const FIELD_ORDER: DraftField[] = ['guestName', 'checkIn', 'checkOut', 'rooms', 'guests']

const QUESTIONS: Record<DraftField, string> = {
  guestName: 'What is the guest name?',
  checkIn:   'What is the check-in date? (example: 12 Oct)',
  checkOut:  'What is the check-out date? (example: 15 Oct)',
  rooms:     'How many rooms?',
  guests:    'How many guests?',
}

const SAVE_WORDS    = new Set(['save', 'yes', 'y', 'ok', 'okay', 'confirm'])
const DISCARD_WORDS = new Set(['discard', 'no', 'n', 'cancel', 'stop'])

const CONFIRM_BUTTONS: ReplyButton[] = [
  { id: 'booking_save',    title: 'Save' },
  { id: 'booking_discard', title: 'Discard' },
]

// ── Wording ──────────────────────────────────────────────────────────────────

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function describeStay(checkIn: string, checkOut: string): string {
  const nights = nightsBetween(checkIn, checkOut)
  return `${formatDate(checkIn)} to ${formatDate(checkOut)} (${plural(nights, 'night')})`
}

function describeBooking(b: CompleteDraft): string {
  return `${b.guestName}, ${describeStay(b.checkIn, b.checkOut)}, ${plural(b.rooms, 'room')}, ${plural(b.guests, 'guest')}`
}

function helpText(homestay: MatchedHomestay): string {
  return [
    `Hello ${homestay.host_name}! You are the host of "${homestay.title}" on BeNative.`,
    '',
    'You can send:',
    'BOOK Ramesh Patil, 12 Oct to 15 Oct, 2 rooms, 4 guests',
    'CHECK 12 Oct to 15 Oct',
    'LIST',
    'CANCEL 7',
    'ROOMS 3',
  ].join('\n')
}

function roomsNotSetText(homestay: MatchedHomestay): string {
  return `First tell me how many rooms "${homestay.title}" has. For example, send: ROOMS 3`
}

function notEnoughRoomsText(free: number, total: number, draft: CompleteDraft): string {
  const stay = describeStay(draft.checkIn, draft.checkOut)
  if (free === 0) return `Not saved. No rooms are free on ${stay}; all ${total} are booked.`
  return `Not saved. Only ${free} of ${plural(total, 'room')} ${free === 1 ? 'is' : 'are'} free on ${stay}.`
}

function confirmation(homestay: MatchedHomestay, draft: CompleteDraft): AssistantReply {
  return {
    text: [
      `Please confirm this booking for "${homestay.title}":`,
      draft.guestName,
      describeStay(draft.checkIn, draft.checkOut),
      `${plural(draft.rooms, 'room')}, ${plural(draft.guests, 'guest')}`,
    ].join('\n'),
    buttons: CONFIRM_BUTTONS,
  }
}

// ── Booking: collect details, confirm, save ──────────────────────────────────

async function freeRooms(homestayId: string, total: number, draft: CompleteDraft): Promise<number> {
  const booked = await getBookedRooms(homestayId, draft.checkIn, draft.checkOut)
  return Math.max(total - booked, 0)
}

/** Asks for the next missing detail, or shows the confirmation when complete. */
async function continueBooking(
  identityId: string,
  homestay:   MatchedHomestay,
  input:      BookingDraft,
): Promise<AssistantReply> {
  const total = await getTotalRooms(homestay.id)
  if (total === null) {
    await setPendingAction(identityId, null)
    return { text: roomsNotSetText(homestay) }
  }

  const draft = { ...input }
  let note = ''

  if (draft.checkIn && draft.checkOut) {
    if (draft.checkOut <= draft.checkIn) {
      draft.checkOut = null
      note = 'The check-out date must be after the check-in date. '
    } else if (nightsBetween(draft.checkIn, draft.checkOut) > MAX_NIGHTS) {
      draft.checkOut = null
      note = 'That stay is longer than a year. '
    }
  }

  const missing = FIELD_ORDER.find(field => draft[field] === null)
  if (missing) {
    const pending: PendingBooking = { type: 'booking', homestayId: homestay.id, draft, step: missing }
    await setPendingAction(identityId, pending)
    return { text: note + QUESTIONS[missing] }
  }

  const complete = draft as CompleteDraft
  const free     = await freeRooms(homestay.id, total, complete)
  if (complete.rooms > free) {
    await setPendingAction(identityId, null)
    return { text: notEnoughRoomsText(free, total, complete) }
  }

  const pending: PendingBooking = { type: 'booking', homestayId: homestay.id, draft, step: 'confirm' }
  await setPendingAction(identityId, pending)
  return confirmation(homestay, complete)
}

/** Fills the detail the host was asked for from their reply. */
async function answerQuestion(
  identityId: string,
  homestay:   MatchedHomestay,
  pending:    PendingBooking,
  step:       DraftField,
  text:       string,
): Promise<AssistantReply> {
  const draft = { ...pending.draft }

  switch (step) {
    case 'guestName': draft.guestName = parseNameAnswer(text); break
    case 'checkIn':   draft.checkIn   = parseDateAnswer(text, todayISO()); break
    case 'checkOut':  draft.checkOut  = parseDateAnswer(text, draft.checkIn ? addDays(draft.checkIn, 1) : todayISO()); break
    case 'rooms':     draft.rooms     = parseCountAnswer(text); break
    case 'guests':    draft.guests    = parseCountAnswer(text); break
  }

  if (draft[step] === null) {
    return { text: `Sorry, I could not read that. ${QUESTIONS[step]}\nTo stop, send: discard` }
  }

  return continueBooking(identityId, homestay, draft)
}

async function saveBooking(
  identityId: string,
  homestay:   MatchedHomestay,
  draft:      CompleteDraft,
): Promise<AssistantReply> {
  await setPendingAction(identityId, null)

  // Rooms may have been taken since the confirmation was shown
  const total = await getTotalRooms(homestay.id)
  if (total === null) return { text: roomsNotSetText(homestay) }

  const free = await freeRooms(homestay.id, total, draft)
  if (draft.rooms > free) return { text: notEnoughRoomsText(free, total, draft) }

  const bookingNo = await createBooking({ homestayId: homestay.id, identityId, ...draft })
  return { text: `Booking #${bookingNo} saved for "${homestay.title}".\n${describeBooking(draft)}` }
}

// ── Other commands ───────────────────────────────────────────────────────────

async function checkAvailability(
  homestay: MatchedHomestay,
  checkIn:  string | null,
  checkOut: string | null,
): Promise<AssistantReply> {
  if (!checkIn) {
    return { text: 'I could not read the date. Example:\nCHECK 12 Oct to 15 Oct' }
  }

  const until = checkOut ?? addDays(checkIn, 1)
  if (until <= checkIn || nightsBetween(checkIn, until) > MAX_NIGHTS) {
    return { text: 'The check-out date must be after the check-in date, and within a year of it. Example:\nCHECK 12 Oct to 15 Oct' }
  }

  const total = await getTotalRooms(homestay.id)
  if (total === null) return { text: roomsNotSetText(homestay) }

  const booked = await getBookedRooms(homestay.id, checkIn, until)
  const free   = Math.max(total - booked, 0)
  const stay   = describeStay(checkIn, until)

  if (free === 0) return { text: `${stay}: fully booked. 0 of ${plural(total, 'room')} free.` }
  return { text: `${stay}: ${free} of ${plural(total, 'room')} free.` }
}

async function listBookings(homestay: MatchedHomestay): Promise<AssistantReply> {
  const bookings = await listUpcomingBookings(homestay.id, todayISO(), LIST_LIMIT + 1)
  if (bookings.length === 0) {
    return { text: `No upcoming bookings for "${homestay.title}".` }
  }

  const lines = bookings.slice(0, LIST_LIMIT).map(b =>
    `#${b.booking_no} ${describeBooking({
      guestName: b.guest_name,
      checkIn:   b.check_in,
      checkOut:  b.check_out,
      rooms:     b.rooms,
      guests:    b.guests,
    })}`,
  )
  if (bookings.length > LIST_LIMIT) lines.push(`Only the next ${LIST_LIMIT} are shown.`)

  return { text: [`Upcoming bookings for "${homestay.title}":`, ...lines].join('\n') }
}

async function updateRooms(homestay: MatchedHomestay, count: number | null): Promise<AssistantReply> {
  if (count === null) {
    const total = await getTotalRooms(homestay.id)
    return {
      text: total === null
        ? roomsNotSetText(homestay)
        : `"${homestay.title}" has ${plural(total, 'room')} in total. To change it, send for example: ROOMS 3`,
    }
  }

  await setTotalRooms(homestay.id, count)
  return { text: `"${homestay.title}" now has ${plural(count, 'room')} in total.` }
}

async function cancelSavedBooking(homestay: MatchedHomestay, bookingNo: number | null): Promise<AssistantReply> {
  if (bookingNo === null) {
    return { text: 'Send CANCEL followed by the booking number, for example: CANCEL 7\nSend LIST to see the numbers.' }
  }

  const booking = await cancelBooking(homestay.id, bookingNo)
  if (!booking) {
    return { text: `No active booking #${bookingNo} was found for "${homestay.title}". Send LIST to see the numbers.` }
  }

  return {
    text: `Booking #${booking.booking_no} cancelled.\n${describeBooking({
      guestName: booking.guest_name,
      checkIn:   booking.check_in,
      checkOut:  booking.check_out,
      rooms:     booking.rooms,
      guests:    booking.guests,
    })}`,
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

/**
 * Decides the reply to a message, given the homestays the sender's number
 * matches. Booking commands work only when exactly one homestay matches.
 */
export async function handleHostMessage(
  identityId: string,
  matches:    MatchedHomestay[],
  text:       string,
): Promise<AssistantReply> {
  if (matches.length === 0) {
    return { text: 'This number is not registered with any BeNative homestay. To list your stay, visit benative.in/list-your-stay' }
  }

  if (matches.length > 1) {
    const titles = matches.map(m => m.title).join(', ')
    return {
      text: `Hello ${matches[0].host_name}! This number is registered for ${matches.length} homestays on BeNative: ${titles}.\n`
        + 'Booking commands are not available yet for a number linked to more than one homestay.',
    }
  }

  const homestay = matches[0]
  const stored   = await getPendingAction<PendingBooking>(identityId, PENDING_MAX_AGE_MINUTES)
  const pending  = stored?.type === 'booking' && stored.homestayId === homestay.id ? stored : null

  // While a booking is unfinished, only an exactly spelled command interrupts it
  const command = parseCommand(text, !pending)

  if (pending) {
    const word       = text.toLowerCase().replace(/[^a-z]/g, '')
    const interrupts =
      command.kind === 'book' || command.kind === 'check' || command.kind === 'list' ||
      (command.kind === 'cancel' && command.bookingNo !== null)

    if (!interrupts) {
      if (DISCARD_WORDS.has(word)) {
        await setPendingAction(identityId, null)
        return { text: 'Booking discarded. Nothing was saved.' }
      }
      if (pending.step !== 'confirm') {
        return answerQuestion(identityId, homestay, pending, pending.step, text)
      }
      if (SAVE_WORDS.has(word)) {
        return saveBooking(identityId, homestay, pending.draft as CompleteDraft)
      }
      return confirmation(homestay, pending.draft as CompleteDraft)
    }

    await setPendingAction(identityId, null)
  }

  switch (command.kind) {
    case 'book':   return continueBooking(identityId, homestay, command.draft)
    case 'check':  return checkAvailability(homestay, command.checkIn, command.checkOut)
    case 'list':   return listBookings(homestay)
    case 'rooms':  return updateRooms(homestay, command.count)
    case 'cancel': return cancelSavedBooking(homestay, command.bookingNo)
    default:       return { text: helpText(homestay) }
  }
}
