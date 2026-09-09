from ..extensions import db
from ..models import Application, ApplicationEvent, Company, Offer

VALID_STATUSES = {
    "A_ETUDIER",
    "A_CANDIDATER",
    "CANDIDATE",
    "RELANCE",
    "ENTRETIEN",
    "OFFRE",
    "ACCEPTE",
    "REFUSE",
    "ABANDONNE",
}


def create_application(company_name, job_title, offer_text, url=""):
    company = Company.query.filter_by(name=company_name.strip()).first()
    if company is None:
        company = Company(name=company_name.strip())
        db.session.add(company)
        db.session.flush()
    application = Application(company=company, job_title=job_title.strip())
    application.offer = Offer(raw_text=offer_text.strip(), url=url.strip() or None)
    db.session.add(application)
    db.session.flush()
    db.session.add(ApplicationEvent(application_id=application.id, event_type="CREATED"))
    db.session.commit()
    return application


def update_status(application, status):
    if status not in VALID_STATUSES:
        raise ValueError("Statut de candidature invalide")
    previous = application.status
    application.status = status
    db.session.add(
        ApplicationEvent(
            application_id=application.id,
            event_type="STATUS_CHANGED",
            detail=f"{previous} -> {status}",
        )
    )
    db.session.commit()
    return application
