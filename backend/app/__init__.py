from flask import Flask, g, jsonify, request
from dotenv import load_dotenv

from .config import Config
from .extensions import db, cors
from .utils.clerk_auth import ClerkAuthError, ClerkConfigurationError, verify_clerk_session_token

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    cors.init_app(
        app,
        origins=[app.config["FRONTEND_ORIGIN"]],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.before_request
    def require_clerk_authentication():
        if request.method == "OPTIONS" or request.path == "/api/health":
            return None

        authorization_header = request.headers.get("Authorization", "")
        scheme, _, token = authorization_header.partition(" ")

        if scheme.lower() != "bearer" or not token.strip():
            return jsonify({"error": "Unauthorized"}), 401

        try:
            claims = verify_clerk_session_token(token.strip(), app.config)
        except ClerkConfigurationError as exc:
            return jsonify({"error": str(exc)}), 500
        except ClerkAuthError:
            return jsonify({"error": "Unauthorized"}), 401

        g.clerk_claims = claims
        g.current_user = {
            "id": claims.get("sub"),
            "email": claims.get("email"),
            "firstName": claims.get("given_name"),
            "lastName": claims.get("family_name"),
        }

    # Register blueprints here as you build them out, e.g.:
    # from .routes.auth_routes import auth_bp
    # app.register_blueprint(auth_bp, url_prefix="/api/auth")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app
