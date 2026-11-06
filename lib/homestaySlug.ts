// The page address of a homestay, from its name: "Povli Forest Homestay" → "povli-forest-homestay".
// Shared by the admin's Publish and the host's Launch, so both put the page at the same address.
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
