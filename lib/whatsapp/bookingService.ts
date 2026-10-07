import { createAdminClient } from '@/lib/supabase/admin'
import { addDays } from './commandParser'

export interface Booking {
  booking_no:  number
  guest_name:  string
  check_in:    string   // YYYY-MM-DD
  check_out:   string   // YYYY-MM-DD, the departure day
  rooms:       number
  guests:      number
  status:      'confirmed' | 'cancelled'
  guest_phone: string | null
  notes:       string | null
}

export interface NewBooking {
  homestayId: string
  identityId: string
  guestName:  string
  checkIn:    string
  checkOut:   string
  rooms:      number
  guests:     number
  guestPhone: string | null
  notes:      string | null
}

/** The details of a booking that can be changed after it is saved. */
export interface BookingUpdate {
  checkIn?:    string
  checkOut?:   string
  guests?:     number
  guestName?:  string
  guestPhone?: string
  notes?:      string
}

const BOOKING_COLUMNS =
  'booking_no, guest_name, check_in, check_out, rooms, guests, status, guest_phone, notes'

/** Total rooms the host has declared, or null if not set yet. */
export async function getTotalRooms(homestayId: string): Promise<number | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('homestays')
    .select('total_rooms')
    .eq('id', homestayId)
    .single()

  if (error) throw new Error(`Failed to read room count for ${homestayId}: ${error.message}`)

  return data.total_rooms ?? null
}

export async function setTotalRooms(homestayId: string, totalRooms: number): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('homestays')
    .update({ total_rooms: totalRooms })
    .eq('id', homestayId)

  if (error) throw new Error(`Failed to set room count for ${homestayId}: ${error.message}`)
}

/**
 * Highest number of rooms already booked on any single night of the stay.
 * The stay covers the nights from checkIn up to, but not including, checkOut.
 * Pass excludeBookingNo when moving a booking, so it does not block itself.
 */
export async function getBookedRooms(
  homestayId:        string,
  checkIn:           string,
  checkOut:          string,
  excludeBookingNo?: number,
): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('booking_no, check_in, check_out, rooms')
    .eq('homestay_id', homestayId)
    .eq('status', 'confirmed')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)

  if (error) throw new Error(`Failed to read bookings for ${homestayId}: ${error.message}`)

  const overlapping = ((data ?? []) as Pick<Booking, 'booking_no' | 'check_in' | 'check_out' | 'rooms'>[])
    .filter(b => b.booking_no !== excludeBookingNo)

  let peak = 0
  for (let night = checkIn; night < checkOut; night = addDays(night, 1)) {
    const booked = overlapping
      .filter(b => b.check_in <= night && night < b.check_out)
      .reduce((sum, b) => sum + b.rooms, 0)
    peak = Math.max(peak, booked)
  }

  return peak
}

/** Saves a booking and returns its booking number. */
export async function createBooking(booking: NewBooking): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      homestay_id:         booking.homestayId,
      guest_name:          booking.guestName,
      check_in:            booking.checkIn,
      check_out:           booking.checkOut,
      rooms:               booking.rooms,
      guests:              booking.guests,
      guest_phone:         booking.guestPhone,
      notes:               booking.notes,
      created_by_identity: booking.identityId,
    })
    .select('booking_no')
    .single()

  if (error || !data) {
    throw new Error(`Failed to save booking for ${booking.homestayId}: ${error?.message}`)
  }

  return data.booking_no
}

/**
 * Bookings whose guests have not yet left, earliest first. Confirmed only,
 * unless includeCancelled is set.
 */
export async function listUpcomingBookings(
  homestayId:       string,
  today:            string,
  limit:            number,
  includeCancelled: boolean = false,
): Promise<Booking[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('homestay_id', homestayId)
    .gt('check_out', today)

  if (!includeCancelled) query = query.eq('status', 'confirmed')

  const { data, error } = await query
    .order('check_in', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to list bookings for ${homestayId}: ${error.message}`)

  return (data ?? []) as Booking[]
}

/**
 * Confirmed bookings that touch the days from `from` up to, but not
 * including, `to`: arriving, staying or leaving in that time. Earliest first.
 */
export async function listBookingsInRange(
  homestayId: string,
  from:       string,
  to:         string,
): Promise<Booking[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('homestay_id', homestayId)
    .eq('status', 'confirmed')
    .lt('check_in', to)
    .gte('check_out', from)
    .order('check_in', { ascending: true })
    .limit(200)

  if (error) throw new Error(`Failed to list bookings for ${homestayId}: ${error.message}`)

  return (data ?? []) as Booking[]
}

/** One confirmed booking of this homestay, or null if there is none with that number. */
export async function getBooking(
  homestayId: string,
  bookingNo:  number,
): Promise<Booking | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('homestay_id', homestayId)
    .eq('booking_no', bookingNo)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (error) throw new Error(`Failed to read booking ${bookingNo}: ${error.message}`)

  return (data as Booking | null) ?? null
}

/**
 * Changes a confirmed booking of this homestay.
 * Returns the updated booking, or null if no confirmed booking has that number.
 */
export async function updateBooking(
  homestayId: string,
  bookingNo:  number,
  update:     BookingUpdate,
): Promise<Booking | null> {
  const supabase = createAdminClient()

  const fields: Record<string, string | number> = {}
  if (update.checkIn    !== undefined) fields.check_in    = update.checkIn
  if (update.checkOut   !== undefined) fields.check_out   = update.checkOut
  if (update.guests     !== undefined) fields.guests      = update.guests
  if (update.guestName  !== undefined) fields.guest_name  = update.guestName
  if (update.guestPhone !== undefined) fields.guest_phone = update.guestPhone
  if (update.notes      !== undefined) fields.notes       = update.notes

  const { data, error } = await supabase
    .from('bookings')
    .update(fields)
    .eq('homestay_id', homestayId)
    .eq('booking_no', bookingNo)
    .eq('status', 'confirmed')
    .select(BOOKING_COLUMNS)
    .maybeSingle()

  if (error) throw new Error(`Failed to change booking ${bookingNo}: ${error.message}`)

  return (data as Booking | null) ?? null
}

/**
 * Marks a confirmed booking of this homestay as cancelled.
 * Returns the booking, or null if no confirmed booking has that number.
 */
export async function cancelBooking(
  homestayId: string,
  bookingNo:  number,
): Promise<Booking | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('homestay_id', homestayId)
    .eq('booking_no', bookingNo)
    .eq('status', 'confirmed')
    .select(BOOKING_COLUMNS)
    .maybeSingle()

  if (error) throw new Error(`Failed to cancel booking ${bookingNo}: ${error.message}`)

  return (data as Booking | null) ?? null
}
