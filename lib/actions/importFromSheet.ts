'use server'

export interface SheetRow {
  rowIndex: number
  timestamp: string
  // Host
  fullName:          string
  whatsapp:          string
  mobile:            string
  email:             string
  language:          string
  // Homestay
  homestayName:      string
  village:           string
  taluka:            string
  district:          string
  state:             string
  googleMapsLink:    string
  howToReach:        string
  // Accommodation
  numberOfRooms:     string
  maxGuests:         string
  facilities:        string
  foodAvailable:     string
  foodType:          string
  // Experiences
  activities:        string
  bestTimeToVisit:   string
  pickupDrop:        string
  ownVehicle:        string
  // Story
  story:             string
  uniqueFeature:     string
  villageSpecial:    string
  nearbyAttractions: string
  nature:            string
  anythingElse:      string
  // Media
  googleDrivePhotos: string
  instagram:         string
  facebook:          string
  website:           string
  youtube:           string
}

function extractSheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let col = ''
  let row: string[] = []
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') { col += '"'; i++ }
      else if (ch === '"') inQuote = false
      else col += ch
    } else {
      if (ch === '"') inQuote = true
      else if (ch === ',') { row.push(col); col = '' }
      else if (ch === '\n') { row.push(col); rows.push(row); row = []; col = '' }
      else if (ch === '\r') { /* skip */ }
      else col += ch
    }
  }
  if (col || row.length) { row.push(col); rows.push(row) }
  return rows
}

function mapRow(headers: string[], values: string[]): SheetRow {
  const get = (keywords: string[]): string => {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(kw.toLowerCase()))
      if (idx >= 0) return (values[idx] ?? '').trim()
    }
    return ''
  }

  return {
    rowIndex:          0,
    timestamp:         get(['timestamp']),
    fullName:          get(['full name']),
    whatsapp:          get(['whatsapp']),
    mobile:            get(['mobile number']),
    email:             get(['email']),
    language:          get(['preferred language']),
    homestayName:      get(['homestay name']),
    village:           get(['village', 'locality']),
    taluka:            get(['taluka']),
    district:          get(['district']),
    state:             get(['state']),
    googleMapsLink:    get(['google maps']),
    howToReach:        get(['how can travelers reach', 'reach your homestay']),
    numberOfRooms:     get(['number of rooms']),
    maxGuests:         get(['maximum guests']),
    facilities:        get(['facilities available']),
    foodAvailable:     get(['food available']),
    foodType:          get(['type of food']),
    activities:        get(['activities do you offer', 'what activities']),
    bestTimeToVisit:   get(['best time to visit']),
    pickupDrop:        get(['pickup']),
    ownVehicle:        get(['own vehicle']),
    story:             get(['tell us your story', 'how did your homestay']),
    uniqueFeature:     get(['makes your homestay unique']),
    villageSpecial:    get(['makes your village special']),
    nearbyAttractions: get(['nearby attractions']),
    nature:            get(['farming, conservation, birding']),
    anythingElse:      get(['anything else']),
    googleDrivePhotos: get(['google drive']),
    instagram:         get(['instagram']),
    facebook:          get(['facebook']),
    website:           get(['website']),
    youtube:           get(['youtube']),
  }
}

export async function importFromSheet(
  sheetUrl: string,
): Promise<{ rows: SheetRow[] } | { error: string }> {
  const id = extractSheetId(sheetUrl)
  if (!id) return { error: 'Invalid Google Sheet URL. Make sure you paste the full spreadsheet link.' }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`

  let text: string
  try {
    const res = await fetch(csvUrl, { cache: 'no-store' })
    if (!res.ok) {
      if (res.status === 403) return { error: 'Sheet is not publicly accessible. Please set sharing to "Anyone with the link can view".' }
      return { error: `Failed to fetch sheet (HTTP ${res.status}). Check the URL and sharing settings.` }
    }
    text = await res.text()
  } catch {
    return { error: 'Could not reach the Google Sheet. Check your internet connection.' }
  }

  const allRows = parseCsv(text)
  if (allRows.length < 2) return { error: 'The sheet appears to be empty — no form responses found.' }

  const headers = allRows[0]
  const dataRows = allRows.slice(1).filter(r => r.some(c => c.trim()))

  if (dataRows.length === 0) return { error: 'No responses found in the sheet yet.' }

  const rows: SheetRow[] = dataRows.map((r, i) => ({ ...mapRow(headers, r), rowIndex: i }))
  return { rows }
}
