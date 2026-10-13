// The wording of the Privacy Policy page (/privacy), in the order it appears.
//
// To change the wording, edit the text between the backticks (`…`).
// Apostrophes and quotation marks are fine inside them.
// When the policy changes, also change PRIVACY_UPDATED.
//
// Each section shows its paragraphs first, then its points as a bulleted
// list, then its closing lines.

export interface PolicySection {
  heading:     string
  paragraphs?: string[]
  points?:     string[]
  closing?:    string[]
}

export const PRIVACY_UPDATED = '13 October 2026'

export const PRIVACY_INTRO = `This page explains what information BeNative collects when you use our website, why we collect it and what choices you have. We have tried to keep it short and plain.`

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    heading: `Who we are`,
    paragraphs: [
      `BeNative is a platform for discovering homestays in India. If you have any question about this policy or about your information, write to us at support.benative@gmail.com.`,
    ],
  },
  {
    heading: `What we collect`,
    paragraphs: [
      `We collect only what we need to run the website.`,
    ],
    points: [
      `When you create an account: your name, your email address and a password. Your password is stored in a protected form that we cannot read.`,
      `When you sign in with Google: your name, email address and profile picture, as shared by Google. We never see your Google password.`,
      `On your profile: your name and, if you add one, a profile photo.`,
      `When you write a review: your rating and your comments.`,
      `When you use the Contact Us form: your name, email address and message.`,
      `When you ask to list your homestay: the host's name, phone number and email address, the address and location of the home, the type of stay, the number of rooms, your description and the link to your photos.`,
      `When you recommend a homestay: your name, phone number and email address, and the homestay's name, address, host name and host contact that you give us.`,
      `When you browse: the pages you visit, the page you came from and the type of browser you use. We use this to count visits. It is not linked to your name.`,
    ],
  },
  {
    heading: `How we use your information`,
    points: [
      `To create and manage your account.`,
      `To show full homestay details and host contact details to visitors who are signed in.`,
      `To publish reviews.`,
      `To reply to your messages and requests.`,
      `To review and publish homestay listings.`,
      `To understand how the website is used and to improve it.`,
    ],
    closing: [
      `We do not sell your information, and we do not use it for advertising.`,
    ],
  },
  {
    heading: `What other people can see`,
    points: [
      `Homestay pages are public. A host's name, the home's location, photos and description can be seen by anyone, and may be shared on BeNative's social media.`,
      `A host's contact details are shown only to visitors who are signed in.`,
      `Reviews are public and show the reviewer's name.`,
      `Your email address and password are never shown to other visitors.`,
    ],
  },
  {
    heading: `Cookies`,
    paragraphs: [
      `We use cookies only to keep you signed in. We do not use advertising cookies. A video you choose to play may set cookies from YouTube.`,
    ],
  },
  {
    heading: `How long we keep it`,
    paragraphs: [
      `We keep your account information for as long as you have an account. Messages and listing requests are kept for as long as we need them to reply to you and to keep a record. You can ask us to delete your information at any time.`,
    ],
  },
  {
    heading: `Your choices`,
    points: [
      `You can see and change your name and photo on your profile page.`,
      `You can ask us for a copy of the information we hold about you.`,
      `You can ask us to correct or delete your information, or to close your account.`,
    ],
    closing: [
      `To do any of these, write to support.benative@gmail.com. We will reply as soon as we can.`,
    ],
  },
  {
    heading: `Children`,
    paragraphs: [
      `BeNative is meant for adults. Please do not create an account if you are under 18.`,
    ],
  },
  {
    heading: `Keeping information safe`,
    paragraphs: [
      `We take reasonable steps to protect your information, including encrypted connections and restricted access. No website can promise complete security, so please use a strong password.`,
    ],
  },
  {
    heading: `Changes to this policy`,
    paragraphs: [
      `If we change this policy, we will update this page and the date at the top.`,
    ],
  },
]
