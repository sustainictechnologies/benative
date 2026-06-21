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

interface ListingData {
  host_name: string
  phone: string
  email: string
  address: string
  village: string
  taluka: string
  district: string
  state: string
  stay_type: string
  rooms: string
  description: string
  drive_link: string
}

export async function sendListingEmails(data: ListingData) {
  try {
    await Promise.all([
      transporter.sendMail({
        from:    `"BeNative Listings" <${process.env.GMAIL_USER}>`,
        to:      SUPPORT_EMAIL,
        subject: `New listing request from ${data.host_name}`,
        text: [
          `A new homestay listing request has been submitted.`,
          ``,
          `Host Name : ${data.host_name}`,
          `Phone     : ${data.phone}`,
          `Email     : ${data.email}`,
          `Address   : ${data.address}`,
          `Location  : ${data.village}, ${data.taluka}, ${data.district}, ${data.state}`,
          `Stay Type : ${data.stay_type}`,
          `Rooms     : ${data.rooms}`,
          ``,
          `About the home:`,
          data.description,
          ``,
          `Photos (Drive) : ${data.drive_link}`,
        ].join('\n'),
      }),
      transporter.sendMail({
        from:    `"BeNative" <${process.env.GMAIL_USER}>`,
        to:      data.email,
        subject: 'We received your listing request — BeNative',
        text: [
          `Hi ${data.host_name},`,
          ``,
          `Thank you for registering your homestay with BeNative!`,
          `We've received your listing request and our team will review it shortly.`,
          `We'll reach out to you on ${data.phone} within 48 hours.`,
          ``,
          `Here's a summary of what you submitted:`,
          `  Location  : ${data.village}, ${data.taluka}, ${data.district}, ${data.state}`,
          `  Stay Type : ${data.stay_type}`,
          `  Rooms     : ${data.rooms}`,
          ``,
          `If you have any questions, visit benative.in/contact`,
          ``,
          `Warm regards,`,
          `The BeNative Team`,
        ].join('\n'),
      }),
    ])
    return { success: true }
  } catch {
    return { error: 'Failed to send confirmation email. Please try again.' }
  }
}
