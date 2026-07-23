import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
	const { isLoaded: isAuthLoaded, isSignedIn, userId, sessionId, getToken } = useClerkAuth()
	const { isLoaded: isUserLoaded, user } = useUser()
	const clerk = useClerk()
	const [sessionToken, setSessionToken] = useState(null)

	useEffect(() => {
		let isMounted = true

		async function syncSessionToken() {
			if (!isAuthLoaded || !isSignedIn) {
				if (isMounted) {
					setSessionToken(null)
				}

				return
			}

			const token = await getToken()

			if (isMounted) {
				setSessionToken(token ?? null)
			}
		}

		void syncSessionToken()

		return () => {
			isMounted = false
		}
	}, [getToken, isAuthLoaded, isSignedIn])

	async function refreshSessionToken() {
		if (!isAuthLoaded || !isSignedIn) {
			setSessionToken(null)
			return null
		}

		const token = await getToken()
		setSessionToken(token ?? null)
		return token ?? null
	}

	const value = useMemo(
		() => ({
			user,
			isLoaded: isAuthLoaded && isUserLoaded,
			isSignedIn,
			userId,
			sessionId,
			sessionToken,
			getToken,
			refreshSessionToken,
			signOut: clerk.signOut,
		}),
		[clerk.signOut, getToken, isAuthLoaded, isSignedIn, isUserLoaded, sessionId, sessionToken, user, userId],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuthContext must be used within an AuthProvider')
	}

	return context
}
