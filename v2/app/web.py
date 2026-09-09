import io
import json
import zipfile
from pathlib import Path

from flask import (
    Blueprint,
    abort,
    current_app,
    flash,
    make_response,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)

from .extensions import db
from .models import Application, ApplicationEvent, GeneratedDocument
from .repositories.applications import VALID_STATUSES, create_application, update_status
from .services.content import generate_application_kit, generate_interview_prep
from .services.cv_builder import build_cv_context
from .services.pdf import render_pdf
from .services.profile import load_master_profile
from .services.scoring import score_offer
from .services.uploads import save_logo, validate_image_upload

web = Blueprint("web", __name__)


@web.get("/")
def dashboard():
    applications = Application.query.order_by(Application.created_at.desc()).all()
    counts = {
        status: Application.query.filter_by(status=status).count() for status in VALID_STATUSES
    }
    return render_template("dashboard.html", applications=applications, counts=counts)


@web.route("/applications/new", methods=["GET", "POST"])
def new_application():
    if request.method == "POST":
        company, title, offer_text = (
            request.form.get(key, "").strip() for key in ("company", "job_title", "offer_text")
        )
        if not company or not title or len(offer_text) < 80:
            flash(
                "Entreprise, poste et offre détaillée (80 caractères minimum) sont requis.", "error"
            )
            return render_template("application_form.html"), 400
        try:
            logo_bytes, extension = validate_image_upload(request.files.get("logo"))
        except ValueError as exc:
            flash(str(exc), "error")
            return render_template("application_form.html"), 400
        application = create_application(
            company, title, offer_text, request.form.get("offer_url", "")
        )
        application.logo_filename = save_logo(
            logo_bytes, extension, current_app.config["UPLOAD_ROOT"], application.id
        )
        profile = load_master_profile(current_app.config["PROFILE_PATH"])
        analysis = score_offer(offer_text, profile["evidence"])
        application.offer.extraction_json = analysis
        application.overall_score, application.recommendation, application.confidence = (
            analysis["overall"],
            analysis["recommendation"],
            analysis["confidence"],
        )
        db.session.commit()
        flash("Candidature créée et analysée.", "success")
        return redirect(url_for("web.application_detail", application_id=application.id))
    return render_template("application_form.html")


@web.get("/applications/<application_id>")
def application_detail(application_id):
    application = db.get_or_404(Application, application_id)
    events = ApplicationEvent.query.filter_by(application_id=application.id).order_by(
        ApplicationEvent.created_at.desc()
    )
    documents = GeneratedDocument.query.filter_by(application_id=application.id).order_by(
        GeneratedDocument.created_at.desc()
    )
    return render_template(
        "application_detail.html",
        application=application,
        events=events,
        documents=documents,
        statuses=sorted(VALID_STATUSES),
        analysis=application.offer.extraction_json or {},
    )


@web.post("/applications/<application_id>/status")
def application_status(application_id):
    application = db.get_or_404(Application, application_id)
    try:
        update_status(application, request.form.get("status", ""))
    except ValueError as exc:
        abort(400, str(exc))
    return redirect(url_for("web.application_detail", application_id=application.id))


@web.get("/applications/<application_id>/logo")
def application_logo(application_id):
    application = db.get_or_404(Application, application_id)
    path = (
        Path(current_app.config["UPLOAD_ROOT"]) / application.id / (application.logo_filename or "")
    )
    if not path.is_file():
        abort(404)
    return send_file(path)


def cv_context(application):
    logo = Path(current_app.config["UPLOAD_ROOT"]) / application.id / application.logo_filename
    portrait = Path(current_app.static_folder) / "assets" / "portrait-melvin.jpg"
    return build_cv_context(
        load_master_profile(current_app.config["PROFILE_PATH"]),
        application.offer.raw_text,
        application.company.name,
        application.job_title,
        logo,
        portrait,
        application.offer.extraction_json or {},
    )


@web.get("/applications/<application_id>/cv")
def cv_preview(application_id):
    application = db.get_or_404(Application, application_id)
    return render_template("cv_document.html", **cv_context(application))


@web.get("/applications/<application_id>/cv.pdf")
def cv_download(application_id):
    application = db.get_or_404(Application, application_id)
    context = cv_context(application)
    output = Path(current_app.config["UPLOAD_ROOT"]) / application.id / "cv-personnalise.pdf"
    pages = render_pdf(render_template("cv_document.html", **context), output)
    db.session.add(
        GeneratedDocument(
            application_id=application.id,
            kind="CV",
            filename=output.name,
            metadata_json={"pages": pages, "selection_log": context["selection_log"]},
        )
    )
    db.session.add(ApplicationEvent(application_id=application.id, event_type="CV_GENERATED"))
    db.session.commit()
    response = make_response(send_file(output, as_attachment=True, download_name=output.name))
    response.headers["X-CV-Pages"] = str(pages)
    return response


def generated_page(application_id, kind):
    application = db.get_or_404(Application, application_id)
    profile = load_master_profile(current_app.config["PROFILE_PATH"])
    analysis = application.offer.extraction_json or {}
    data = (
        generate_application_kit(profile, application.company.name, application.job_title, analysis)
        if kind == "KIT"
        else generate_interview_prep(
            profile, application.company.name, application.job_title, analysis
        )
    )
    if GeneratedDocument.query.filter_by(application_id=application.id, kind=kind).first() is None:
        content = data["summary"] if kind == "KIT" else data["pitch_120"]
        db.session.add(
            GeneratedDocument(
                application_id=application.id,
                kind=kind,
                content=content,
                metadata_json={"sources": data["source_evidence"]},
            )
        )
        db.session.add(
            ApplicationEvent(application_id=application.id, event_type=f"{kind}_GENERATED")
        )
        db.session.commit()
    return application, data


@web.get("/applications/<application_id>/kit")
def application_kit(application_id):
    application, kit = generated_page(application_id, "KIT")
    return render_template("kit.html", application=application, kit=kit)


@web.get("/applications/<application_id>/interview")
def interview_prep(application_id):
    application, prep = generated_page(application_id, "INTERVIEW")
    return render_template("interview.html", application=application, prep=prep)


@web.get("/pipeline")
def pipeline():
    columns = [
        (
            status,
            Application.query.filter_by(status=status)
            .order_by(Application.updated_at.desc())
            .all(),
        )
        for status in VALID_STATUSES
    ]
    return render_template("pipeline.html", columns=columns)


@web.get("/applications/<application_id>/export.json")
def export_application(application_id):
    app = db.get_or_404(Application, application_id)
    payload = {
        "id": app.id,
        "company": app.company.name,
        "job_title": app.job_title,
        "status": app.status,
        "score": app.overall_score,
        "recommendation": app.recommendation,
        "confidence": app.confidence,
        "offer": {
            "url": app.offer.url,
            "raw_text": app.offer.raw_text,
            "analysis": app.offer.extraction_json,
        },
        "events": [
            {
                "type": event.event_type,
                "detail": event.detail,
                "created_at": event.created_at.isoformat(),
            }
            for event in ApplicationEvent.query.filter_by(application_id=app.id).all()
        ],
    }
    response = current_app.response_class(
        json.dumps(payload, ensure_ascii=False, indent=2), mimetype="application/json"
    )
    response.headers["Content-Disposition"] = f'attachment; filename="candidature-{app.id}.json"'
    return response


@web.get("/backup.zip")
def backup():
    stream = io.BytesIO()
    instance = Path(current_app.instance_path).resolve()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
        database = instance / "cv_melvin.db"
        if database.is_file():
            archive.write(database, "cv_melvin.db")
        uploads = Path(current_app.config["UPLOAD_ROOT"]).resolve()
        if uploads.is_dir() and uploads.is_relative_to(instance):
            for path in uploads.rglob("*"):
                if path.is_file():
                    archive.write(path, path.relative_to(instance).as_posix())
        archive.writestr("README.txt", "Sauvegarde locale CV-Melvin sans fichier .env ni secret.")
    stream.seek(0)
    return send_file(
        stream, mimetype="application/zip", as_attachment=True, download_name="cv-melvin-backup.zip"
    )
