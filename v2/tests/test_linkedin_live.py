"""Optional live browser check for the published LinkedIn import."""

import os

import pytest
from playwright.sync_api import sync_playwright


@pytest.mark.skipif(os.getenv("LIVE_LINKEDIN_TEST") != "1", reason="live integration check")
def test_published_linkedin_link_loads_complete_carrefour_offer():
    url = (
        "https://www.linkedin.com/jobs/view/4466540260/"
        "?trk=eml-email_job_alert_digest_01-primary_job_list-0-jobcard_body_1_jobid_4466540260"
        "&refId=usaW%2F0ehzZBy7y7NUKbAPg%3D%3D"
    )
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://sarthe72.github.io/melvinpasse/v2/web/#new")
        page.fill('input[name="url"]', url)
        page.click("#link-form button")
        page.wait_for_selector("#new-form:not(.hidden)")
        assert page.input_value('input[name="company"]') == "Carrefour"
        assert page.input_value('input[name="title"]') == "Directeur Entrepôt (F/H)"
        offer = page.input_value('textarea[name="offer"]')
        assert "Allonnes" in offer
        assert "Vos Missions" in offer
        assert len(offer) > 2000
        browser.close()
