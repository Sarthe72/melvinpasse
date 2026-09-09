from .offers import extract_offer, normalize

CONCEPTS = {
    "Pilotage de centre de profit": ("centre de profit", "p&l", "marge", "budget", "rentabilite"),
    "Management opérationnel": ("management", "manager", "equipe", "collaborateur", "recrutement"),
    "Gestion de la performance": ("performance", "indicateur", "kpi", "productivite", "reporting"),
    "Gestion de projet": ("gestion de projet", "transformation", "deploiement"),
    "Structuration des process": ("process", "procedure", "amelioration continue", "organisation"),
    "Logistique et flux": (
        "logistique",
        "flux",
        "transport",
        "plateforme",
        "entrepot",
        "supply chain",
    ),
    "Gestion des stocks": ("stock", "inventaire", "approvisionnement"),
    "Relation clients grands comptes": ("grand compte", "relation client", "satisfaction client"),
    "Négociation fournisseurs": ("fournisseur", "achat", "negociation", "sourcing"),
    "Outils de pilotage": ("excel", "power bi", "crm", "wms", "sage"),
}
GAPS = {
    "Anglais requis": (
        "anglais courant",
        "anglais professionnel",
        "english fluent",
        "bilingue anglais",
    ),
    "Diplôme Bac+5 requis": ("bac+5", "master", "ecole d'ingenieur", "diplome d'ingenieur"),
    "Certification Lean/Six Sigma": ("six sigma", "black belt", "green belt", "certification lean"),
    "SAP requis": ("sap obligatoire", "maitrise de sap", "expert sap"),
}


def contains(text, phrases):
    return any(normalize(phrase) in text for phrase in phrases)


def score_offer(text, evidence):
    normalized = normalize(text)
    extraction = extract_offer(text)
    matches = [name for name, phrases in CONCEPTS.items() if contains(normalized, phrases)]
    gaps = [name for name, phrases in GAPS.items() if contains(normalized, phrases)]
    profile_fit = max(0, min(100, (35 if not matches else 50 + 6 * len(matches)) - 10 * len(gaps)))
    personal_fit, personal_reasons = 50, []
    for detected, reason, points in (
        (extraction["mentions_autonomy"], "Autonomie ou latitude explicitement mentionnée", 12),
        (extraction["mentions_management"], "Management d'équipe explicitement présent", 12),
        (
            contains(
                normalized,
                ("centre de profit", "direction de site", "directeur", "responsable de site"),
            ),
            "Niveau de responsabilité cohérent",
            14,
        ),
        (
            contains(
                normalized, ("structurer", "transformation", "developper", "amelioration continue")
            ),
            "Possibilité de structurer ou transformer",
            10,
        ),
    ):
        if detected:
            personal_fit += points
            personal_reasons.append(reason)
    red_flags = []
    if extraction["mentions_saturday"] and contains(
        normalized, ("samedi obligatoire", "tous les samedis", "chaque samedi")
    ):
        red_flags.append("Travail régulier le samedi explicitement imposé")
    if contains(normalized, ("sans autonomie", "execution uniquement", "poste executant")):
        red_flags.append("Faible autonomie explicitement indiquée")
    salary = extraction["salary_eur"]
    if salary and salary < 55_000:
        red_flags.append(f"Rémunération annoncée très inférieure au repère historique ({salary} €)")
    personal_fit = max(0, min(100, personal_fit - 30 * len(red_flags)))
    opportunity_fit, opportunity_reasons = 45, []
    for phrases, reason, points in (
        (("direction", "directeur", "responsable"), "Responsabilité managériale ou de site", 20),
        (
            ("transformation", "croissance", "developpement"),
            "Contexte de transformation ou croissance",
            15,
        ),
        (("budget", "p&l", "centre de profit"), "Périmètre économique explicite", 15),
    ):
        if contains(normalized, phrases):
            opportunity_fit += points
            opportunity_reasons.append(reason)
    opportunity_fit = min(100, opportunity_fit)
    explicit = sum(
        (
            bool(extraction["location_mentions"]),
            salary is not None,
            extraction["mentions_contract"],
            extraction["mentions_management"],
            extraction["mentions_autonomy"],
            len(text) >= 800,
        )
    )
    confidence = 35 + explicit * 10
    missing = ([] if salary is not None else ["Rémunération non indiquée"]) + (
        [] if extraction["location_mentions"] else ["Localisation non détectée avec certitude"]
    )
    overall = round(profile_fit * 0.45 + personal_fit * 0.35 + opportunity_fit * 0.20)
    recommendation = (
        "NO GO"
        if overall < 55 or red_flags
        else ("GO" if overall >= 75 and not missing else "À ÉTUDIER")
    )
    ranked = sorted(
        evidence,
        key=lambda item: sum(normalize(tag) in normalized for tag in item["tags"]),
        reverse=True,
    )
    selected = [
        item for item in ranked if any(normalize(tag) in normalized for tag in item["tags"])
    ][:2] or ranked[:2]
    return {
        "extraction": extraction,
        "profile_fit": profile_fit,
        "personal_fit": personal_fit,
        "opportunity_fit": opportunity_fit,
        "confidence": confidence,
        "overall": overall,
        "recommendation": recommendation,
        "matches": matches,
        "gaps": gaps,
        "red_flags": red_flags,
        "personal_reasons": personal_reasons,
        "opportunity_reasons": opportunity_reasons,
        "critical_missing": missing,
        "selected_evidence": selected,
    }
