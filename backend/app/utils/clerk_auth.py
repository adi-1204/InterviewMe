import json
from functools import lru_cache
from urllib.error import URLError
from urllib.request import urlopen

import jwt
from jwt.algorithms import RSAAlgorithm


class ClerkAuthError(Exception):
    pass


class ClerkConfigurationError(ClerkAuthError):
    pass


class ClerkTokenError(ClerkAuthError):
    pass


def _clerk_jwks_url(config):
    explicit_jwks_url = config.get("CLERK_JWKS_URL")
    if explicit_jwks_url:
        return explicit_jwks_url

    issuer = config.get("CLERK_ISSUER")
    if issuer:
        return issuer.rstrip("/") + "/.well-known/jwks.json"

    raise ClerkConfigurationError(
        "Clerk authentication is not configured. Set CLERK_JWKS_URL or CLERK_ISSUER."
    )


@lru_cache(maxsize=8)
def _fetch_jwks(jwks_url):
    try:
        with urlopen(jwks_url, timeout=5) as response:
            return json.load(response)
    except (URLError, TimeoutError, ValueError) as exc:
        raise ClerkTokenError("Unable to load Clerk signing keys.") from exc


def verify_clerk_session_token(token, config):
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as exc:
        raise ClerkTokenError("Invalid Clerk token header.") from exc

    if unverified_header.get("alg") != "RS256":
        raise ClerkTokenError("Unsupported Clerk token algorithm.")

    kid = unverified_header.get("kid")
    if not kid:
        raise ClerkTokenError("Missing Clerk token key identifier.")

    jwks = _fetch_jwks(_clerk_jwks_url(config))
    matching_key = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)

    if not matching_key:
        raise ClerkTokenError("No Clerk signing key matched the provided token.")

    public_key = RSAAlgorithm.from_jwk(json.dumps(matching_key))
    audience = config.get("CLERK_AUDIENCE")
    issuer = config.get("CLERK_ISSUER")

    decode_options = {"verify_aud": bool(audience)}

    try:
        return jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=audience,
            issuer=issuer,
            options=decode_options,
        )
    except jwt.PyJWTError as exc:
        raise ClerkTokenError("Invalid Clerk session token.") from exc