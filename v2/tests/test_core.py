import io
import json
from pathlib import Path

from PIL import Image

from app.models import ApplicationEvent, Evidence, ProfileItem, UserPreference
from app.repositories.applications import create_application, update_status
from app.services.content import generate_application_kit, generate_interview_prep
from app.services.cv_builder import build_cv_context
from app.services.offers import extract_offer
from app.services.palette import palette_from_logo
from app.services.pdf import render_pdf
from app.services.profile import load_master_profile, seed_master_profile
from app.services.scoring import score_offer


def logo_stream(color="#3366cc"):
    stream = io.BytesIO()
    Image.new("RGB", (100, 45), color).save(stream, "PNG")
    stream.seek(0)
    return stream


def test_health(client):
    assert client.get("/health").get_json()["status"] == "ok"


def test_seed_and_status(app):
    with app.app_context():
        seed_master_profile(app.config["PROFILE_PATH"])
        seed_master_profile(app.config["PROFILE_PATH"])
        assert (
            Evidence.query.count(),
            ProfileItem.query.count(),
            UserPreference.query.count(),
        ) == (4, 9, 3)
        item = create_application("Test", "Directeur", "Pilotage d'une équipe")
        update_status(item, "CANDIDATE")
        assert ApplicationEvent.query.count() == 2


def test_offer_and_scoring(app):
    profile = load_master_profile(app.config["PROFILE_PATH"])
    text = "Directeur de site en CDI basé à Laval. Management, centre de profit, budget, performance, transformation et autonomie. Rémunération 80 k€."
    assert extract_offer(text)["salary_eur"] == 80_000
    result = score_offer(text, profile["evidence"])
    assert result["overall"] >= 75 and result["recommendation"] == "GO"
    blocked = score_offer(
        "Poste exécutant sans autonomie. Tous les samedis obligatoires. Salaire 40 k€.",
        profile["evidence"],
    )
    assert blocked["recommendation"] == "NO GO" and len(blocked["red_flags"]) == 3


def test_cv_context_and_pdf(app, tmp_path):
    logo = tmp_path / "logo.png"
    Image.new("RGB", (100, 40), "#8a1538").save(logo)
    profile = load_master_profile(app.config["PROFILE_PATH"])
    context = build_cv_context(
        profile,
        "logistique management stocks",
        "Test",
        "Directeur",
        logo,
        Path(app.static_folder) / "assets" / "portrait-melvin.jpg",
        {"matches": ["Logistique et flux"], "selected_evidence": profile["evidence"][:2]},
    )
    master = {fact for exp in profile["experience"] for fact in exp["facts"]}
    assert all(fact in master for exp in context["experiences"] for fact in exp["facts"])
    assert palette_from_logo(logo)["primary"] != "#123f73"
    output = tmp_path / "one.pdf"
    assert render_pdf("<style>@page{size:A4}</style><h1>CV</h1>", output) == 1


def test_content_is_evidence_bound(app):
    profile = load_master_profile(app.config["PROFILE_PATH"])
    evidence = profile["evidence"][0]
    analysis = {"matches": ["Gestion de projet"], "selected_evidence": [evidence]}
    kit = generate_application_kit(profile, "Test", "Directeur", analysis)
    prep = generate_interview_prep(profile, "Test", "Directeur", analysis)
    assert evidence["facts"][0] in kit["letter"] and evidence["facts"][0] in prep["pitch_120"]


def test_complete_journey(client):
    created = client.post(
        "/applications/new",
        data={
            "company": "Entreprise Parcours",
            "job_title": "Directeur des opérations",
            "offer_text": (
                "CDI basé à Laval. Direction avec autonomie, management, centre de profit, budget, logistique, performance et transformation. Rémunération 80 k€. "
            )
            * 4,
            "logo": (logo_stream(), "logo.png"),
        },
        content_type="multipart/form-data",
    )
    assert created.status_code == 302
    url = created.location
    assert "Décision recommandée" in client.get(url).text
    assert "@page{size:A4" in client.get(url + "/cv").text
    assert "Lettre de motivation" in client.get(url + "/kit").text
    assert "Pitch 60 secondes" in client.get(url + "/interview").text
    client.post(url + "/status", data={"status": "CANDIDATE"})
    assert json.loads(client.get(url + "/export.json").data)["status"] == "CANDIDATE"
    assert client.get("/pipeline").status_code == 200


def test_security_and_backup(client):
    invalid = client.post(
        "/applications/new",
        data={
            "company": "X",
            "job_title": "Y",
            "offer_text": "offre assez longue " * 10,
            "logo": (io.BytesIO(b"fake"), "logo.png"),
        },
        content_type="multipart/form-data",
    )
    assert invalid.status_code == 400
    backup = client.get("/backup.zip")
    assert backup.data.startswith(b"PK")
