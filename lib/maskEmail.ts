// "sameer@gmail.com" → "sa•••@gmail.com": enough for a host to recognise their email, not enough to read it
export function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}•••@${domain ?? ''}`
}
