import { Navigate } from 'react-router-dom'
import { SignUp } from '@clerk/clerk-react'
import useAuth from '../hooks/useAuth.js'
import { authCardShellClassName, authShellClassName, clerkAppearance } from '../styles/clerkAppearance.js'

function Signup() {
	const { isLoaded, isSignedIn } = useAuth()

	if (isLoaded && isSignedIn) {
		return <Navigate to="/onboarding" replace />
	}

	return (
		<div className={authShellClassName}>
			<div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
				<div className="flex justify-center lg:order-2">
					<div className={authCardShellClassName}>
						<SignUp
							routing="path"
							path="/signup"
							signInUrl="/login"
							forceRedirectUrl="/onboarding"
							afterSignUpUrl="/onboarding"
							appearance={clerkAppearance}
						/>
					</div>
				</div>

				<section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl lg:order-1 lg:p-10">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,169,75,0.16),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(62,156,143,0.14),transparent_36%)]" />
					<div className="relative max-w-xl">
						<p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Create account</p>
						<h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[var(--paper-50)] sm:text-5xl">
							Make the first login feel polished.
						</h1>
						<p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
							The signup flow now follows the InterviewMe visual system: warm spotlight action, calm ink backdrop, and readable embedded Clerk controls.
						</p>
						<div className="mt-8 grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Readable</p>
								<p className="mt-2 text-sm text-slate-300">Buttons and labels use contrast that works on dark surfaces.</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Human</p>
								<p className="mt-2 text-sm text-slate-300">Editorial headline and softer depth keep the page inviting.</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Fast</p>
								<p className="mt-2 text-sm text-slate-300">Users can choose email/password or Google and proceed immediately.</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

export default Signup
