import { createAdminClient } from '@/lib/supabase/admin'
import { addDays } from './commandParser'

export interface Booking {
  booking_no: number
  guest_name: string
  check_in:   string   // YYYY-MM-DD
  check_out:  string   // YYYY-MM-DD, the departure day
  rooms:      number
  guests:     number
}

export interface NewBooking {
  homestayId: string
  identityId: string
  guestName:  string
  checkIn:    string
  checkOut:   string
  rooms:      number
  guests:     number
}

const BOOKING_COLUMNS = 'booking_no, guest_name, check_in, check_out, rooms, guests'

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
 */
export async function getBookedRooms(
  homestayId: string,
  checkIn:    string,
  checkOut:   string,
): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('check_in, check_out, rooms')
    .eq('homestay_id', homestayId)
    .eq('status', 'confirmed')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)

  if (error) throw new Error(`Failed to read bookings for ${homestayId}: ${error.message}`)

  const overlapping = (data ?? []) as Pick<Booking, 'check_in' | 'check_out' | 'rooms'>[]

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
      created_by_identity: booking.identityId,
    })
    .select('booking_no')
    .single()

  if (error || !data) {
    throw new Error(`Failed to save booking for ${booking.homestayId}: ${error?.message}`)
  }

  return data.booking_no
}

/** Confirmed bookings whose guests have not yet left, earliest first. */
export async function listUpcomingBookings(
  homestayId: string,
  today:      string,
  limit:      number,
): Promise<Booking[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('homestay_id', homestayId)
    .eq('status', 'confirmed')
    .gt('check_out', today)
    .order('check_in', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to list bookings for ${homestayId}: ${error.message}`)

  return (data ?? []) as Booking[]
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
