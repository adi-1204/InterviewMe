import useAuth from '../hooks/useAuth.js'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

function buildHeaders({ token, headers = {}, body }) {
	const requestHeaders = new Headers(headers)

	if (body !== undefined && body !== null && !requestHeaders.has('Content-Type')) {
		requestHeaders.set('Content-Type', 'application/json')
	}

	if (token) {
		requestHeaders.set('Authorization', `Bearer ${token}`)
	}

	return requestHeaders
}

export async function apiRequest(path, options = {}) {
	const { token, body, headers, ...fetchOptions } = options
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...fetchOptions,
		headers: buildHeaders({ token, headers, body }),
		body:
			body === undefined || body === null || typeof body === 'string'
				? body
				: JSON.stringify(body),
	})

	if (!response.ok) {
		const errorBody = await response.json().catch(() => null)
		const errorMessage = errorBody?.error ?? `Request failed with status ${response.status}`
		throw new Error(errorMessage)
	}

	if (response.status === 204) {
		return null
	}

	return response.json()
}

export function useApiClient() {
	const { sessionToken, refreshSessionToken } = useAuth()

	async function request(path, options = {}) {
		const token = options.token ?? sessionToken ?? (await refreshSessionToken())

		return apiRequest(path, {
			...options,
			token,
		})
	}

	return {
		request,
		sessionToken,
		refreshSessionToken,
	}
}
