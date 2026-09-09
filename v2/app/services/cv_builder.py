import base64
from pathlib import Path

from .offers import normalize
from .palette import palette_from_logo


def data_uri(path):
    path = Path(path)
    mime = {".png": "image/png", ".webp": "image/webp"}.get(path.suffix.lower(), "image/jpeg")
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def rank(values, offer):
    normalized = normalize(offer)
    return sorted(values, key=lambda value: normalize(value) in normalized, reverse=True)


def build_cv_context(profile, offer, company, job_title, logo_path, portrait_path, analysis):
    skills = rank(profile["skills"], offer)[:8]
    experiences = [
        {**exp, "facts": rank(exp["facts"], offer)[: 6 if index == 0 else 2]}
        for index, exp in enumerate(profile["experience"])
    ]
    evidence = analysis.get("selected_evidence", profile["evidence"][:2])[:2]
    return {
        "profile": profile,
        "company": company,
        "job_title": job_title,
        "subtitle": " · ".join(analysis.get("matches", [])[:2]) or profile["signature"],
        "skills": skills,
        "experiences": experiences,
        "evidence": evidence,
        "palette": palette_from_logo(logo_path),
        "logo_uri": data_uri(logo_path),
        "portrait_uri": data_uri(portrait_path),
        "selection_log": {
            "skills_retained": skills,
            "evidence_retained": [item["id"] for item in evidence],
            "reason": "Correspondances explicites avec l'offre.",
        },
    }
