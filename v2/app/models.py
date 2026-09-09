from datetime import UTC, datetime
from uuid import uuid4

from .extensions import db


def utcnow():
    return datetime.now(UTC)


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class Company(db.Model, TimestampMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    website = db.Column(db.String(500))


class Application(db.Model, TimestampMixin):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    job_title = db.Column(db.String(250), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="A_ETUDIER")
    logo_filename = db.Column(db.String(255))
    overall_score = db.Column(db.Integer)
    recommendation = db.Column(db.String(30))
    confidence = db.Column(db.Integer)
    company = db.relationship("Company", backref=db.backref("applications", lazy=True))
    offer = db.relationship(
        "Offer", backref="application", uselist=False, cascade="all, delete-orphan"
    )


class Offer(db.Model, TimestampMixin):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(
        db.String(36), db.ForeignKey("application.id"), unique=True, nullable=False
    )
    url = db.Column(db.String(1000))
    raw_text = db.Column(db.Text, nullable=False)
    extraction_json = db.Column(db.JSON, default=dict, nullable=False)


class ProfileItem(db.Model, TimestampMixin):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    source_key = db.Column(db.String(100), unique=True, nullable=False)
    data = db.Column(db.JSON, nullable=False)


class Evidence(db.Model, TimestampMixin):
    id = db.Column(db.String(100), primary_key=True)
    title = db.Column(db.String(250), nullable=False)
    tags = db.Column(db.JSON, default=list, nullable=False)
    facts = db.Column(db.JSON, default=list, nullable=False)


class GeneratedDocument(db.Model, TimestampMixin):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.String(36), db.ForeignKey("application.id"), nullable=False)
    kind = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text)
    filename = db.Column(db.String(255))
    metadata_json = db.Column(db.JSON, default=dict, nullable=False)


class ApplicationEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.String(36), db.ForeignKey("application.id"), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    detail = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class UserPreference(db.Model, TimestampMixin):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.JSON, nullable=False)
