from pathlib import Path

from flask import Flask, jsonify

from .config import Config
from .extensions import db


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    db.init_app(app)
    from .services.profile import seed_master_profile

    @app.cli.command("init-db")
    def init_db_command():
        db.create_all()
        seed_master_profile(app.config["PROFILE_PATH"])
        print("Base CV-Melvin initialisée.")

    @app.get("/health")
    def health():
        return jsonify(status="ok", service="cv-melvin")

    from .web import web

    app.register_blueprint(web)
    return app
