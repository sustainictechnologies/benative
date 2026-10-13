import Link from 'next/link'
import GoogleSignInButton from './GoogleSignInButton'

// The sign-in pop-up shown over a blurred homestay page to a visitor without an account.
// It starts below the site header (h-16, z-[1000]) so the menu stays usable.
export default function SignupGate({ slug }: { slug: string }) {
  const next = `/homestays/${slug}`

  return (
    <div
      role="dialog"
      aria-labelledby="signup-gate-title"
      className="fixed inset-x-0 top-16 bottom-0 z-[900] flex items-center justify-center bg-stone-900/40 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white px-6 pt-7 pb-5 text-center shadow-2xl">
        <h2 id="signup-gate-title" className="text-xl font-bold text-stone-900 mb-2">Sign in to continue</h2>
        <p className="text-sm text-stone-500 leading-relaxed mb-5">
          Create a free account to see the photos, rooms, how to reach and the host&apos;s contact details.
        </p>

        <GoogleSignInButton next={next} className="w-full" />

        <div className="flex items-center gap-3 text-xs text-stone-400 my-3.5">
          <span className="flex-1 h-px bg-stone-200" />
          or
          <span className="flex-1 h-px bg-stone-200" />
        </div>

        <Link
          href={`/login?mode=signup&next=${next}`}
          className="flex w-full items-center justify-center bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
        >
          Sign up with email
        </Link>

        <p className="text-[13px] text-stone-500 mt-4">
          Already have an account?{' '}
          <Link href={`/login?next=${next}`} className="text-brand-600 hover:text-brand-800 font-semibold">
            Log in
          </Link>
        </p>

        <Link
          href="/discover"
          className="block mt-4 pt-3.5 border-t border-stone-100 text-[12.5px] font-medium text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to Discover
        </Link>
      </div>
    </div>
  )
}
