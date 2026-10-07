// Main words for each kind of request a host can type. To teach the assistant
// a new way of saying something, add the phrase to the matching list.
//
// Rules:
//  - lower case only
//  - a phrase matches whole words, in the order written ("one more day")
//  - the lists are checked from top to bottom and the first match wins, so
//    the more specific requests come first

export type Intent =
  | 'stop'
  | 'guests'
  | 'extend'
  | 'shorten'
  | 'checkout'
  | 'details'
  | 'cancel'
  | 'availability'
  | 'list'
  | 'move'
  | 'change'
  | 'find'
  | 'create'
  | 'rooms'
  | 'menu'

export const INTENT_PHRASES: { intent: Intent; phrases: string[] }[] = [
  // Stop whatever is in progress; nothing is saved
  {
    intent:  'stop',
    phrases: [
      'forget it', 'never mind', 'nevermind', 'leave it', 'stop', 'discard',
      "don't book", 'dont book', 'do not book', 'cancel this', 'cancel it',
    ],
  },

  // Change the number of guests on a booking
  {
    intent:  'guests',
    phrases: [
      'more guests', 'more guest', 'more people', 'fewer guests', 'less guests',
      'fewer people', 'less people', 'guests instead', 'people instead',
      'persons instead', 'guest count', 'number of guests', 'change guests',
    ],
  },

  // Stay longer
  {
    intent:  'extend',
    phrases: [
      'one more day', 'one more night', 'more day', 'more days', 'more night',
      'more nights', 'extra day', 'extra night', 'another day', 'another night',
      'extend', 'stay longer', 'staying longer',
    ],
  },

  // Leave sooner
  {
    intent:  'shorten',
    phrases: [
      'day early', 'days early', 'night early', 'nights early', 'leave early',
      'leaving early', 'checkout early', 'check out early', 'shorten',
    ],
  },

  // A new check-out date
  {
    intent:  'checkout',
    phrases: [
      'checkout to', 'check out to', 'check-out to', 'checkout on', 'check out on',
      'check-out on', 'will check out', 'will checkout', 'checks out on',
      'checking out on', 'will leave', 'leave on', 'leaving on', 'leaves on',
    ],
  },

  // Guest phone, name or a note
  {
    intent:  'details',
    phrases: [
      'phone number is', 'phone is', 'mobile is', 'number is', 'name is actually',
      'rename', 'add a note', 'add note', 'note that',
    ],
  },

  // Cancel a booking
  {
    intent:  'cancel',
    phrases: [
      'cancel', "isn't coming", 'isnt coming', 'is not coming', 'not coming',
      "won't come", 'wont come', 'will not come', 'remove', 'delete',
    ],
  },

  // Are these dates free?
  {
    intent:  'availability',
    phrases: [
      'available', 'availability', 'free', 'vacant', 'vacancy', 'can i take',
      'any room', 'any rooms',
    ],
  },

  // Arrivals, departures and upcoming bookings
  {
    intent:  'list',
    phrases: [
      'who is coming', "who's coming", 'whos coming', 'who is arriving',
      'who is staying', 'who booked', 'checking out', 'check-ins', 'check ins',
      'checkins', 'check-outs', 'check outs', 'checkouts', 'arrivals',
      'departures', 'next booking', 'upcoming', 'bookings', 'how many', 'list',
    ],
  },

  // Move a booking to other dates
  {
    intent:  'move',
    phrases: [
      'move', 'shift', 'reschedule', 'postpone', 'prepone', 'will now arrive',
      'will arrive', 'arrive on', 'arriving on', 'change dates', 'change date',
      'change the dates',
    ],
  },

  // A change that the rest of the message has to explain
  {
    intent:  'change',
    phrases: ['change', 'update', 'modify', 'edit'],
  },

  // Look up one guest's booking
  {
    intent:  'find',
    phrases: [
      'show', 'find', 'search', 'when is', "what's", 'whats', 'what is',
      'details of', 'status', 'confirmed', 'cancelled', 'canceled',
    ],
  },

  // Add a booking
  {
    intent:  'create',
    phrases: [
      'book', 'add', 'coming', 'will come', 'will stay', 'is staying', 'staying',
      'got a booking', 'new booking', 'booking for', 'booking from', 'reserve',
      'reservation',
    ],
  },

  // Total rooms in the homestay
  {
    intent:  'rooms',
    phrases: ['set rooms', 'total rooms', 'room count', 'number of rooms'],
  },

  // Show the menu
  {
    intent:  'menu',
    phrases: ['menu', 'help', 'options', 'start', 'hi', 'hello', 'hey', 'namaste'],
  },
]
