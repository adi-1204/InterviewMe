import { Navigate } from 'react-router-dom'
import { SignIn } from '@clerk/clerk-react'
import useAuth from '../hooks/useAuth.js'
import { authCardShellClassName, authShellClassName, clerkAppearance } from '../styles/clerkAppearance.js'

function Login() {
	const { isLoaded, isSignedIn } = useAuth()

	if (isLoaded && isSignedIn) {
		return <Navigate to="/onboarding" replace />
	}

	return (
		<div className={authShellClassName}>
			<div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
				<section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl lg:p-10">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,169,75,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(62,156,143,0.14),transparent_36%)]" />
					<div className="relative max-w-xl">
						<p className="text-xs uppercase tracking-[0.35em] text-cyan-300">InterviewMe</p>
						<h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[var(--paper-50)] sm:text-5xl">
							Step into a calmer interview room.
						</h1>
						<p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
							Sign in to pick up your session, keep your authenticated state, and move into the workflow with a UI that follows the spotlight spec instead of the default Clerk look.
						</p>
						<div className="mt-8 grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Focus</p>
								<p className="mt-2 text-sm text-slate-300">Warm spotlight accent, not neon noise.</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Clarity</p>
								<p className="mt-2 text-sm text-slate-300">High-contrast buttons and readable form text.</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Momentum</p>
								<p className="mt-2 text-sm text-slate-300">Fast path back into the interview flow.</p>
							</div>
						</div>
					</div>
				</section>

				<div className="flex justify-center">
					<div className={authCardShellClassName}>
					<SignIn
						routing="path"
						path="/login"
						signUpUrl="/signup"
						forceRedirectUrl="/onboarding"
						afterSignInUrl="/onboarding"
							appearance={clerkAppearance}
					/>
				</div>
				</div>
			</div>
		</div>
	)
}

export default Login
