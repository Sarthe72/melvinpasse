import json
from pathlib import Path

from ..extensions import db
from ..models import Evidence, ProfileItem, UserPreference


def load_master_profile(path):
    with Path(path).open(encoding="utf-8") as stream:
        return json.load(stream)


def seed_master_profile(path):
    profile = load_master_profile(path)
    for category in (
        "identity",
        "summary",
        "signature",
        "experience",
        "skills",
        "soft_skills",
        "digital",
        "education",
        "engagement",
    ):
        item = ProfileItem.query.filter_by(source_key=category).first() or ProfileItem(
            source_key=category, category=category
        )
        item.data = profile[category]
        db.session.add(item)
    for raw in profile.get("evidence", []):
        item = db.session.get(Evidence, raw["id"]) or Evidence(id=raw["id"])
        item.title, item.tags, item.facts = raw["title"], raw["tags"], raw["facts"]
        db.session.add(item)
    for key, value in profile.get("preferences", {}).items():
        item = UserPreference.query.filter_by(key=key).first() or UserPreference(key=key)
        item.value = value
        db.session.add(item)
    db.session.commit()
    return profile
