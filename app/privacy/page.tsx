import type { Metadata } from 'next'
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from '@/lib/privacyPolicy'

export const metadata: Metadata = {
  title: 'Privacy Policy · BeNative',
  description: 'What information BeNative collects, why we collect it and the choices you have.',
}

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-stone-400">Last updated: {PRIVACY_UPDATED}</p>
        </div>
      </section>

      {/* Body — the wording lives in lib/privacyPolicy.ts */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20 text-stone-600 leading-relaxed">
        <p>{PRIVACY_INTRO}</p>

        {PRIVACY_SECTIONS.map(section => (
          <div key={section.heading} className="mt-10">
            <h2 className="text-xl font-bold text-stone-900 mb-3">{section.heading}</h2>
            <div className="space-y-3">
              {section.paragraphs?.map(text => <p key={text}>{text}</p>)}
              {section.points && (
                <ul className="list-disc pl-5 space-y-2">
                  {section.points.map(text => <li key={text}>{text}</li>)}
                </ul>
              )}
              {section.closing?.map(text => <p key={text}>{text}</p>)}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
