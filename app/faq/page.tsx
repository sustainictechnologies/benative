import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { FAQ_GROUPS } from '@/lib/faqs'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions · BeNative',
  description: 'Answers to common questions from travellers and hosts about BeNative, a platform for discovering homestays.',
}

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-tight mb-6">
            Frequently Asked Questions
          </h1>
        </div>
      </section>

      {/* Questions — the wording lives in lib/faqs.ts */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20 space-y-12">
        {FAQ_GROUPS.map(group => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-700 mb-3">{group.title}</h2>
            <div className="border-t border-stone-200">
              {group.items.map(item => (
                <details key={item.question} className="group border-b border-stone-200">
                  <summary className="flex items-start justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-base sm:text-lg font-semibold text-stone-900 leading-snug">{item.question}</span>
                    <ChevronDown size={20} className="shrink-0 mt-1 text-stone-400 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="pb-5 pr-9 text-stone-600 leading-relaxed">
                    {item.answer && <p>{item.answer}</p>}
                    {item.points && (
                      <ul className="space-y-3">
                        {item.points.map(point => (
                          <li key={point.title}>
                            <p className="font-semibold text-stone-800">{point.title}</p>
                            <p>{point.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        {/* Still have a question */}
        <div className="rounded-xl bg-brand-50 px-6 py-8 text-center">
          <h2 className="text-xl font-bold text-stone-900 mb-2">Still have a question?</h2>
          <p className="text-stone-600 mb-5">Send us a message and we&apos;ll get back to you soon.</p>
          <Link
            href="/contact"
            className="inline-flex items-center bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  )
}
