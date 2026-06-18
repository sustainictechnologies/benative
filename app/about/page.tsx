import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Why BeNative Exists · BeNative',
  description: 'BeNative exists to make local knowledge accessible — connecting travelers with communities, naturalists, and hosts who understand these landscapes deeply.',
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-tight mb-6">
            Why BeNative Exists
          </h1>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed space-y-5">
          <p>
            Most places are easier to find than they are to understand. You can locate a remote
            village on a map. You can identify a trail, a lake, or a mountain range from a
            satellite image. What is much harder to find is the local knowledge that gives those
            places meaning.
          </p>

          <div className="pl-6 border-l-2 border-stone-300 space-y-2 text-stone-500 italic my-2">
            <p>Who should you speak to before arriving?</p>
            <p>Which family offers accommodation?</p>
            <p>When is the best season to visit?</p>
            <p>What customs should you be aware of?</p>
            <p>What does daily life actually look like there?</p>
          </div>

          <p>
            That knowledge usually lives with the people who know a place intimately.
          </p>

          <p>
            For generations, travelers found these places through personal recommendations,
            local introductions, and chance encounters. Today, much of that knowledge remains
            difficult to access, particularly in regions that exist outside established
            tourism networks.
          </p>

          <p>
            BeNative exists to make that knowledge accessible.
          </p>

          <p>
            We help travelers discover remarkable places through local communities,
            naturalists, conservationists, birders, farmers, homestay hosts, and residents
            who understand these landscapes far beyond what a guidebook can offer.
          </p>

          <p>
            The places featured here are not resorts, curated experiences, or tourism
            products. They are real communities, landscapes, and ways of life that continue
            to exist on their own terms. What local hosts choose to share is an invitation
            to experience these places with greater depth and understanding than traditional
            travel often allows.
          </p>

          <p>
            For some travelers, that may mean staying with a family in a mountain village.
            For others, it may mean learning from local birders, walking with shepherds,
            participating in seasonal traditions, or simply spending time in a place where
            everyday life remains closely connected to the surrounding landscape.
          </p>

          <p>
            Our role is straightforward. We help connect travelers seeking genuine
            experiences with the people who know these places best.
          </p>

          <p>
            Everything else begins with a conversation.
          </p>
        </div>
      </section>

    </>
  )
}
