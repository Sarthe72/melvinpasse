"""Optional live browser check for protected Indeed listings."""

import os

import pytest
from playwright.sync_api import sync_playwright


@pytest.mark.skipif(os.getenv("LIVE_INDEED_TEST") != "1", reason="live integration check")
def test_published_indeed_link_explains_access_limit_without_invention():
    url = "https://fr.indeed.com/viewjob?jk=33d9e0743029b4f2&from=vj"
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://sarthe72.github.io/melvinpasse/v2/web/#new")
        page.fill('input[name="url"]', url)
        page.click("#link-form button")
        page.wait_for_selector("#new-form:not(.hidden)")
        assert "Indeed bloque la lecture automatisée" in page.locator("#link-help").inner_text()
        assert page.input_value('textarea[name="offer"]') == ""
        assert page.input_value('input[name="company"]') == ""
        browser.close()
