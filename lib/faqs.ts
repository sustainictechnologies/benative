// The questions and answers on the FAQ page (/faq), in the order they appear.
//
// To change the wording, edit the text between the backticks (`…`).
// Apostrophes and quotation marks are fine inside them.
//
// An answer is either one paragraph (answer) or a list of short points, each
// with a bold heading (points). See "What do you get?" for a list.

export interface FaqPoint {
  title: string
  text:  string
}

export interface Faq {
  question: string
  answer?:  string
  points?:  FaqPoint[]
}

export interface FaqGroup {
  title: string
  items: Faq[]
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'For travellers',
    items: [
      {
        question: `What is BeNative?`,
        answer:   `BeNative is a platform for discovering homestays that let you experience a place beyond the usual tourist route. We bring together homes, hosts, and local experiences that feel personal, rooted, and genuinely connected to the place.`,
      },
      {
        question: `How is BeNative different from a hotel or resort booking platform?`,
        answer:   `BeNative is exclusively for homestays. We don't list hotels or resorts. We help travellers discover authentic, independently run homes where they can experience the place, the people and the local way of life. BeNative is a discovery platform, not a traditional booking website. Once you find a homestay you like, you can connect directly with the host.`,
      },
      {
        question: `What kind of stays can I find on BeNative?`,
        answer:   `You'll find independent homestays, family-run homes, village stays, heritage homes, farm stays, and other unique places that offer a more personal experience. We focus on stays that have a sense of place and aren't simply resorts in disguise.`,
      },
      {
        question: `Can I contact the host before staying?`,
        answer:   `Yes. We want you to know a little about the people and place you're staying with before you arrive. Host details and contact options are provided wherever applicable.`,
      },
      {
        question: `Are the homestays verified?`,
        answer:   `We review the stays listed on BeNative and aim to ensure that the information provided is genuine and useful to travellers. However, every homestay is different, and we encourage guests to read the listing carefully and communicate with the host before their stay.`,
      },
      {
        question: `Can I find local experiences through BeNative too?`,
        answer:   `Yes. BeNative isn't only about where you sleep. Some hosts and local communities offer experiences connected to the place from food and walks to everyday activities and things you wouldn't normally find on a tourist itinerary.`,
      },
      {
        question: `Does BeNative charge guests a booking fee or commission?`,
        answer:   `Currently, BeNative does not charge guests a booking commission. Our aim is to make discovering and connecting with authentic homestays as simple as possible.`,
      },
      {
        question: `Will the stay be luxurious?`,
        answer:   `Maybe. Maybe not. We don't want to promise luxury where it doesn't exist. Some homes will be very simple. Some will be more comfortable. What matters is that the listing tells you honestly what to expect.`,
      },
    ],
  },
  {
    title: 'For hosts',
    items: [
      {
        question: `Who can list a homestay on BeNative?`,
        answer:   `If you have a genuine homestay or a home that offers travellers a meaningful local experience, we'd love to hear from you. We're especially interested in independent, family-run, rural, remote, and lesser-known stays.`,
      },
      {
        question: `What do you get?`,
        points: [
          {
            title: `More people can discover your homestay`,
            text:  `Your homestay will have its own page on our website.`,
          },
          {
            title: `No need to spend a lot on social media`,
            text:  `We can also share your homestay, your story, special events, achievements and guest experiences on our social media.`,
          },
          {
            title: `Only homestays on our platform`,
            text:  `So your homestay will not get lost among hotels and resorts.`,
          },
          {
            title: `Guest ratings & feedback`,
            text:  `Guests who come through BeNative can share their experience and rating, helping other travellers trust your homestay.`,
          },
        ],
      },
      {
        question: `Does my homestay need to be a luxury property?`,
        answer:   `Not at all. A beautiful view, a home-cooked meal, an old family home, a quiet village, or a host who knows the place inside out can be far more memorable than luxury.`,
      },
      {
        question: `Is there a fee to list my homestay?`,
        answer:   `We're currently welcoming our first set of hosts without a listing fee. Our goal at this stage is to build a community of wonderful homes and hosts. Any future changes to our pricing model will be communicated clearly to hosts.`,
      },
      {
        question: `Does BeNative take a commission from bookings?`,
        answer:   `No. BeNative's current model does not take a commission from your bookings. We want hosts to have a direct and transparent relationship with their guests.`,
      },
    ],
  },
]
