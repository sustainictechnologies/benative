'use server'

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? process.env.GMAIL_USER!

export async function sendContactEmail(formData: FormData) {
  const name    = formData.get('name')    as string
  const email   = formData.get('email')   as string
  const message = formData.get('message') as string

  if (!name || !email || !message) {
    return { error: 'Please fill in all fields.' }
  }

  try {
    await Promise.all([
      // Notify support
      transporter.sendMail({
        from:    `"BeNative Contact" <${process.env.GMAIL_USER}>`,
        to:      SUPPORT_EMAIL,
        subject: `New contact message from ${name}`,
        text:    `You have a new message via the BeNative contact form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      }),
      // Confirm to user
      transporter.sendMail({
        from:    `"BeNative" <${process.env.GMAIL_USER}>`,
        to:      email,
        subject: 'We received your message — BeNative',
        text:    `Hi ${name},\n\nThank you for reaching out! We've received your message and will get back to you within 1–2 business days.\n\nHere's a copy of what you sent:\n\n"${message}"\n\nWarm regards,\nThe BeNative Team`,
      }),
    ])
    return { success: true }
  } catch {
    return { error: 'Failed to send message. Please try again.' }
  }
}
