import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import useAuth from '../hooks/useAuth.js'

function Onboarding() {
	const { user, isLoaded } = useAuth()

	return (
		<div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
			<div className="mx-auto flex max-w-5xl flex-col gap-8">
				<header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
					<div>
						<p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Authenticated workspace</p>
						<h1 className="mt-1 text-2xl font-semibold">Welcome{isLoaded && user?.firstName ? `, ${user.firstName}` : ''}</h1>
					</div>
					<UserButton afterSignOutUrl="/" />
				</header>

				<section className="grid gap-6 md:grid-cols-2">
					<div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-950/20">
						<p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Next step</p>
						<h2 className="mt-3 text-2xl font-semibold">Your account is active and ready for the interview flow.</h2>
						<p className="mt-3 text-sm leading-6 text-slate-300">
							Clerk is now the source of truth for identity, and the backend will reject protected requests unless they carry a valid bearer token.
						</p>
					</div>

					<div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-cyan-950/20">
						<p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Start here</p>
						<div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
							<p>1. Review your resume.</p>
							<p>2. Begin a mock interview session.</p>
							<p>3. Inspect your feedback report.</p>
						</div>
						<Link
							to="/"
							className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
						>
							Back to landing
						</Link>
					</div>
				</section>
			</div>
		</div>
	)
}

export default Onboarding
