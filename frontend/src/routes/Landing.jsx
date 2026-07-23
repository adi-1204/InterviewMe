import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import useAuth from '../hooks/useAuth.js'

function Landing() {
  const { user, isLoaded } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(232,169,75,0.1),transparent_30%),linear-gradient(180deg,#0F1420_0%,#060912_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">InterviewMe</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[var(--paper-50)]">
              Clerk-authenticated interview practice
            </h1>
          </div>
          <SignedIn>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(255,255,255,0.07)] px-3 py-2">
              <span className="text-sm text-slate-300">
                {isLoaded && user?.firstName ? `Hi, ${user.firstName}` : 'Signed in'}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </header>

        <main className="grid flex-1 place-items-center py-16">
          <section className="w-full max-w-3xl rounded-[2.25rem] border border-white/10 bg-[rgba(255,255,255,0.06)] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Practice better answers</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[var(--paper-50)] sm:text-5xl">
              Build confidence with an AI interview coach that remembers who you are.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Sign up with email and password, keep a valid Clerk session, and move into the app with authenticated access on every protected request.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <SignedOut>
                <Link
                  to="/signup"
                  className="rounded-full bg-[var(--spotlight-500)] px-5 py-3 text-sm font-semibold text-[var(--ink-900)] shadow-lg shadow-amber-950/20 transition hover:bg-[var(--spotlight-600)]"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[var(--paper-50)] transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/onboarding"
                  className="rounded-full bg-[var(--spotlight-500)] px-5 py-3 text-sm font-semibold text-[var(--ink-900)] shadow-lg shadow-amber-950/20 transition hover:bg-[var(--spotlight-600)]"
                >
                  Continue to app
                </Link>
              </SignedIn>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Landing
