"""Optional live end-to-end check for the published Apec import."""

import os

import pytest
from playwright.sync_api import sync_playwright


@pytest.mark.skipif(os.getenv("LIVE_APEC_TEST") != "1", reason="live integration check")
def test_published_apec_link_recovers_complete_offer():
    url = (
        "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/179474342W"
        "?motsCles=directeur&lieux=589916&distance=15&selectedIndex=0&page=0"
    )
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://sarthe72.github.io/melvinpasse/v2/web/#new")
        details = page.evaluate(
            """async url => {
                const first = await extractOffer(url);
                const second = await extractOffer('https://www.partnaire.fr/nos-offres-d-emploi/le-mans-directeur-de-site-h-f-2026-09-10-78707/');
                const fallback = await verifiedApecFallback(url, first.payload);
                return {
                    firstSource: first.payload.source,
                    firstLength: first.payload.text?.length,
                    secondOk: second.ok,
                    secondLength: second.payload.text?.length,
                    fallbackSource: fallback?.source,
                    fallbackLength: fallback?.text?.length,
                };
            }""",
            url,
        )
        page.fill('input[name="url"]', url)
        page.click("#link-form button")
        page.wait_for_selector("#new-form:not(.hidden)")
        details["help"] = page.locator("#link-help").inner_text()
        details["offerLength"] = len(page.input_value('textarea[name="offer"]'))
        browser.close()
    assert details["firstSource"] == "apec-search", details
    assert details["secondOk"], details
    assert details["fallbackSource"] == "verified-recruiter", details
    assert details["fallbackLength"] > 650, details
    assert "site du recruteur" in details["help"], details
    assert details["offerLength"] > 650, details
