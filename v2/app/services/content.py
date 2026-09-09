from .providers import get_content_provider


def generate_application_kit(profile, company, job_title, analysis):
    provider = get_content_provider()
    proofs = analysis.get("selected_evidence", [])[:2]
    lines = [f"{proof['title']} : {' ; '.join(proof['facts'])}" for proof in proofs]
    context = {
        "company": company,
        "job_title": job_title,
        "name": profile["identity"]["name"],
        "summary": profile["summary"],
        "signature": profile["signature"],
        "matches": ", ".join(analysis.get("matches", [])[:4]) or "le pilotage opérationnel",
        "proofs": "\n".join(f"- {line}" for line in lines),
        "proofs_inline": " ; ".join(lines),
    }
    letter = provider.generate(
        "Madame, Monsieur,\n\nVotre recherche d’un(e) {job_title} au sein de {company} retient mon attention, notamment pour : {matches}.\n\n{summary}\n\nDeux réalisations issues de mon parcours :\n{proofs}\n\n{signature}\n\nJe serais heureux d’échanger sur les priorités concrètes du poste.\n\nBien cordialement,\n{name}",
        context,
    )
    message = provider.generate(
        "Bonjour, votre offre de {job_title} chez {company} a retenu mon attention. Mon parcours correspond aux enjeux de {matches}. Repères concrets : {proofs_inline}. Seriez-vous disponible pour un échange ? — {name}",
        context,
    )
    summary = provider.generate(
        "Candidature {job_title} — {company}\n\nPositionnement : {summary}\n\nCorrespondances vérifiées : {matches}\n\nPreuves :\n{proofs}",
        context,
    )
    return {
        "letter": letter,
        "recruiter_message": message,
        "summary": summary,
        "provider": "local",
        "source_evidence": [proof["id"] for proof in proofs],
    }


def generate_interview_prep(profile, company, job_title, analysis):
    proofs = analysis.get("selected_evidence", [])[:2]
    proof_lines = [f"{item['title']} : {' ; '.join(item['facts'])}" for item in proofs]
    matches = analysis.get("matches", [])[:4]
    pitch_60 = f"Je suis {profile['identity']['name']}. {profile['summary']} Pour le poste de {job_title} chez {company}, les correspondances les plus nettes sont : {', '.join(matches) or 'pilotage opérationnel et management'}. Un repère concret : {proof_lines[0] if proof_lines else profile['signature']}"
    pitch_120 = f"{pitch_60}\n\nMon parcours s’est construit dans la même structure, du terrain à la direction. Deux preuves à approfondir : {' | '.join(proof_lines)}. Ma ligne directrice : {profile['signature']} Je souhaite comprendre les priorités des douze premiers mois, le périmètre de décision et les critères de réussite."
    questions = [
        "Pourquoi ce poste et pourquoi maintenant ?",
        "Comment pilotez-vous la performance d’un site ?",
        "Comment faites-vous monter une équipe en compétences ?",
    ]
    if any("logistique" in item.lower() or "stocks" in item.lower() for item in matches):
        questions.append("Comment sécurisez-vous les flux et la gestion des stocks ?")
    cards = [
        {
            "title": proof["title"],
            "verified_facts": proof["facts"],
            "prompt": "Présenter contexte, rôle, actions et résultat en restant sur ces faits. Les détails non consignés sont à confirmer oralement.",
        }
        for proof in proofs
    ]
    to_ask = [
        "Quelles sont les trois priorités des six premiers mois ?",
        "Quel est le périmètre de décision : budget, organisation et recrutements ?",
        "Comment mesurez-vous la réussite à douze mois ?",
        "Quelle est la taille de l’équipe et ses principaux enjeux ?",
        "Quel rythme de travail est attendu, notamment les samedis et déplacements ?",
    ]
    return {
        "pitch_60": pitch_60,
        "pitch_120": pitch_120,
        "likely_questions": questions,
        "star_cards": cards,
        "questions_to_ask": to_ask,
        "clarification_points": analysis.get("critical_missing", []) + analysis.get("gaps", []),
        "source_evidence": [proof["id"] for proof in proofs],
    }
