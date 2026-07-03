'use server'

import type { SheetRow } from './importFromSheet'
import type { CanvasBlock, BlockType } from '@/app/admin/builder/_components/BuilderTypes'
import { DEFAULT_PROPS } from '@/app/admin/builder/_components/BuilderTypes'

export interface GeneratedBlocks {
  blocks:        CanvasBlock[]
  pageName:      string
  pageAddress:   string
  pageLanguages: string[]
}

function makeId() {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function makeBlock(type: BlockType, texts: Record<string, string> = {}, images: Record<string, string> = {}): CanvasBlock {
  return { id: makeId(), type, props: { ...DEFAULT_PROPS, texts, images } }
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables.')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function buildPrompt(row: SheetRow): string {
  return `You are a copywriter helping create a beautiful homestay profile page for an Indian rural homestay on BeNative.in — a platform connecting travelers with authentic local experiences.

Use the following information provided by the homestay host to generate content. Write in warm, inviting English. Keep it natural and honest — do not over-exaggerate. Use short, impactful sentences.

HOST & HOMESTAY DETAILS:
- Host Name: ${row.fullName}
- Homestay Name: ${row.homestayName}
- Village: ${row.village}, ${row.taluka}, ${row.district}, ${row.state}
- Languages Spoken: ${row.language}
- Activities Offered: ${row.activities}
- Best Time to Visit: ${row.bestTimeToVisit}
- Facilities: ${row.facilities}
- Food Available: ${row.foodAvailable} — ${row.foodType}
- How to Reach: ${row.howToReach}
- Google Maps: ${row.googleMapsLink}
- Number of Rooms: ${row.numberOfRooms}, Max Guests: ${row.maxGuests}
- Pickup/Drop: ${row.pickupDrop}, Own Vehicle: ${row.ownVehicle}

HOST'S STORY (in their own words):
"${row.story}"

What makes it unique:
"${row.uniqueFeature}"

Village speciality:
"${row.villageSpecial}"

Nearby attractions:
"${row.nearbyAttractions}"

Nature/farming/conservation involvement:
"${row.nature}"

Additional info:
"${row.anythingElse}"

---

Generate the following JSON (respond with ONLY valid JSON, no markdown, no explanation):

{
  "tagline": "A single punchy tagline for the hero section (max 10 words, evokes the spirit of the place)",
  "storyTitle": "A short welcome heading (max 6 words, e.g. 'Welcome to Our Forest Home')",
  "storyBody": "2-3 paragraph host story combining the story, unique features, and village — warm and personal tone. Use \\n\\n between paragraphs.",
  "foodTitle": "Short food section heading (max 5 words)",
  "foodDesc": "1-2 sentences describing the food experience",
  "reachTitle": "Short 'How to Reach' heading (max 5 words)",
  "reachInstructions": "Clear directions formatted as steps, each on a new line starting with a dash (-)",
  "rulesTitle": "Short house rules heading (max 5 words)",
  "heroSubheading": "One line describing the location beautifully (village, district, state)",
  "activitiesList": ["array of activity names exactly as the host listed them, split by comma if needed"],
  "facilities": ["array of facility names, split from the facilities string"]
}`
}

export async function generateWithAI(
  row: SheetRow,
): Promise<{ result: GeneratedBlocks } | { error: string }> {
  let raw: string
  try {
    raw = await callGemini(buildPrompt(row))
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'AI generation failed.' }
  }

  // Strip markdown fences if present
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  let ai: Record<string, unknown>
  try {
    ai = JSON.parse(cleaned)
  } catch {
    return { error: 'AI returned unexpected output. Please try again.' }
  }

  const str  = (k: string, fallback = '') => (typeof ai[k] === 'string' ? ai[k] as string : fallback)
  const arr  = (k: string): string[]      => (Array.isArray(ai[k]) ? (ai[k] as string[]).map(String) : [])

  // ── Build blocks ──────────────────────────────────────────────

  const blocks: CanvasBlock[] = []

  // Hero
  blocks.push(makeBlock('hero', {
    tagline:         str('tagline', row.homestayName),
    'hero-subtitle': str('heroSubheading', `${row.village}, ${row.district}`),
  }))

  // Host Story
  blocks.push(makeBlock('host-story', {
    'story-title': str('storyTitle', `Welcome to ${row.homestayName}`),
    'story-body':  str('storyBody', row.story),
  }))

  // Activities
  const activityNames = arr('activitiesList').length
    ? arr('activitiesList')
    : row.activities.split(',').map(s => s.trim()).filter(Boolean)

  blocks.push(makeBlock('activity-log', {
    activities: JSON.stringify(
      activityNames.map((name, i) => ({ id: `ai-act-${i}`, label: name, emoji: '🌿', desc: '' }))
    ),
  }))

  // Food
  if (row.foodAvailable.toLowerCase().includes('yes') || row.foodType) {
    blocks.push(makeBlock('food', {
      'food-title': str('foodTitle', 'Home Cooked Meals'),
      'food-desc':  str('foodDesc', row.foodType),
      'food-label': 'Food & Dining',
    }))
  }

  // How to Reach
  const reachRowId  = `row-${Date.now()}`
  const reachCellId = `cell-${Date.now()}`
  blocks.push(makeBlock('how-to-reach', {
    'reach-title':                str('reachTitle', 'How to Reach'),
    'layout-rows':                JSON.stringify([{ id: reachRowId, cols: 1, cells: [{ id: reachCellId, type: 'list' }] }]),
    [`${reachCellId}-items`]:     JSON.stringify(
      str('reachInstructions', row.howToReach)
        .split('\n')
        .map(l => l.replace(/^[-–•]\s*/, '').trim())
        .filter(Boolean)
    ),
  }))

  // Contact (direct fill, no AI)
  blocks.push(makeBlock('contact', {
    'contact-host-name':        row.fullName,
    'contact-phone':            row.mobile,
    'contact-phone-show':       'true',
    'contact-whatsapp':         row.whatsapp,
    'contact-whatsapp-show':    'true',
    'contact-email':            row.email,
    'contact-email-show':       'true',
    'contact-instagram':        row.instagram,
    'contact-instagram-show':   row.instagram ? 'true' : 'false',
    'contact-facebook':         row.facebook,
    'contact-facebook-show':    row.facebook ? 'true' : 'false',
    'contact-youtube':          row.youtube,
    'contact-youtube-show':     row.youtube ? 'true' : 'false',
    'contact-website':          row.website,
    'contact-website-show':     row.website ? 'true' : 'false',
  }))

  // YouTube video block if link exists
  if (row.youtube) {
    const ytMatch = row.youtube.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      blocks.push(makeBlock('video', { 'youtube-url': ytMatch[1] }))
    }
  }

  // Map block
  if (row.googleMapsLink || row.village) {
    blocks.push(makeBlock('map', {
      'map-location':     row.googleMapsLink || `${row.village}, ${row.district}`,
      'map-region':       `${row.district}, ${row.state}`,
      'map-nearest-town': row.taluka || row.district,
    }))
  }

  const pageName    = row.homestayName || 'My Homestay'
  const pageAddress = [row.village, row.taluka, row.district, row.state].filter(Boolean).join(', ')
  const pageLanguages = row.language
    ? row.language.split(/[,/]/).map(l => l.trim()).filter(Boolean)
    : ['English']

  return { result: { blocks, pageName, pageAddress, pageLanguages } }
}
