import Link from 'next/link'
import { Lock } from 'lucide-react'
import GoogleSignInButton from './GoogleSignInButton'

interface Props {
  slug: string
  sections: string[]   // what the visitor will see after signing up
}

// Shown on a homestay page, in place of its details, to a visitor without an account
export default function SignupGate({ slug, sections }: Props) {
  const next = `/homestays/${slug}`

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-6 py-9 text-center">
      <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3.5">
        <Lock size={20} className="text-brand-600" />
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-1.5">Create a free account to see this homestay</h2>
      <p className="text-sm text-stone-500 leading-relaxed max-w-md mx-auto mb-4">
        It takes less than a minute. Then you can see everything about this stay:
      </p>

      <ul className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto mb-6">
        {sections.map(label => (
          <li key={label} className="text-xs font-medium bg-stone-100 text-stone-600 px-3 py-1 rounded-full">
            {label}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-center gap-2.5">
        <GoogleSignInButton next={next} />
        <Link
          href={`/login?mode=signup&next=${next}`}
          className="inline-flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
        >
          Sign up with email
        </Link>
      </div>

      <p className="text-[13px] text-stone-500 mt-4">
        Already have an account?{' '}
        <Link href={`/login?next=${next}`} className="text-brand-600 hover:text-brand-800 font-semibold">
          Log in
        </Link>
      </p>
    </div>
  )
}
