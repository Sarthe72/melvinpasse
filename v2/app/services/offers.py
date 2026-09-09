import re
import unicodedata
from collections import Counter

STOP_WORDS = {
    "avec",
    "dans",
    "pour",
    "vous",
    "votre",
    "vos",
    "nous",
    "notre",
    "une",
    "des",
    "les",
    "sur",
    "par",
    "aux",
    "qui",
    "que",
    "plus",
    "poste",
    "entreprise",
    "missions",
    "profil",
    "experience",
}


def normalize(text):
    return "".join(
        char
        for char in unicodedata.normalize("NFKD", text.lower())
        if not unicodedata.combining(char)
    )


def extract_offer(text):
    normalized = normalize(text)
    words = re.findall(r"\b[a-z][a-z0-9+-]{3,}\b", normalized)
    salary = re.findall(
        r"(?:remuneration|salaire)?\s*(\d{2,3})(?:[\s.]?000|\s*k)\s*(?:€|euros)?", normalized
    )
    locations = re.findall(r"\b(?:à|basé à|situé à)\s+([A-ZÀ-ÖØ-öø-ÿ][\wÀ-ÖØ-öø-ÿ' -]{2,35})", text)
    return {
        "keywords": [
            word
            for word, _ in Counter(word for word in words if word not in STOP_WORDS).most_common(15)
        ],
        "salary_eur": int(salary[0]) * 1000 if salary else None,
        "location_mentions": locations[:3],
        "mentions_saturday": "samedi" in normalized,
        "mentions_travel": bool(re.search(r"deplacement|mobilite|itinera", normalized)),
        "mentions_management": bool(
            re.search(r"management|manager|equipe|collaborateur", normalized)
        ),
        "mentions_autonomy": bool(re.search(r"autonom|latitude|initiative", normalized)),
        "mentions_contract": bool(re.search(r"\bcdi\b|\bcdd\b|contrat", normalized)),
    }
