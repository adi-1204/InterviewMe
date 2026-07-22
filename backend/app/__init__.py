from flask import Flask
from dotenv import load_dotenv

from .config import Config
from .extensions import db, cors

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    cors.init_app(app, origins=[app.config["FRONTEND_ORIGIN"]])

    # Register blueprints here as you build them out, e.g.:
    # from .routes.auth_routes import auth_bp
    # app.register_blueprint(auth_bp, url_prefix="/api/auth")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app
