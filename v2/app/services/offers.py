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


INVALID_LOCATION_WORDS = {
    "activite",
    "client",
    "direction",
    "equipe",
    "management",
    "mission",
    "passage",
    "passant",
    "patrimoine",
    "projet",
    "responsabilite",
    "securite",
    "service",
}


def clean_location(value):
    candidate = re.sub(r"\s+", " ", value or "").strip(" ,;:.-")
    candidate = re.split(
        r"\s+(?:CDI|CDD|avec|pour|au sein|et|rattach[eé]e?|sous la responsabilit[eé]|dans le cadre)\b",
        candidate,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip(" ,;:.-")
    words = candidate.split()
    if not 2 <= len(candidate) <= 45 or len(words) > 5:
        return None
    normalized_words = set(normalize(candidate).split())
    if normalized_words & INVALID_LOCATION_WORDS:
        return None
    if re.search(r"\d", candidate) and not re.search(r"\b\d{5}\b|\(\d{2,3}\)", candidate):
        return None
    return candidate


def extract_locations(text):
    patterns = [
        r"(?:localisation|lieu de travail|implantation)\s*[:\-]\s*([^.;|\n]{2,55})",
        r"(?:poste\s+)?(?:bas[eé]|situ[eé]|localis[eé])\s+(?:à|au|aux|en)\s+([^.;|\n]{2,55})",
        r"(?:poste|emploi)\s+(?:à|sur)\s+([^.;|\n]{2,45})",
    ]
    found = []
    for pattern in patterns:
        for raw_value in re.findall(pattern, text, flags=re.IGNORECASE):
            value = clean_location(raw_value)
            if value and value not in found:
                found.append(value)
    if not found:
        postal = re.search(
            r"\b(\d{5})\s+([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÿ' -]{2,30})(?=[,.;|]|$)", text
        )
        if postal:
            value = clean_location(f"{postal.group(2)} ({postal.group(1)[:2]})")
            if value:
                found.append(value)
    return found[:3]


def extract_offer(text):
    normalized = normalize(text)
    words = re.findall(r"\b[a-z][a-z0-9+-]{3,}\b", normalized)
    salary = re.findall(
        r"(?:remuneration|salaire)?\s*(\d{2,3})(?:[\s.]?000|\s*k)\s*(?:€|euros)?", normalized
    )
    locations = extract_locations(text)
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
