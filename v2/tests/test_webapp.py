from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from PIL import Image
from playwright.sync_api import sync_playwright


def test_mobile_browser_journey(tmp_path):
    repository_root = Path(__file__).resolve().parents[2]
    handler = partial(SimpleHTTPRequestHandler, directory=repository_root)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logo = tmp_path / "logo.png"
    Image.new("RGB", (120, 60), "#1d4ed8").save(logo)
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 390, "height": 844})
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/", wait_until="networkidle")
            assert "Vos candidatures, du premier regard" not in page.locator("body").inner_text()
            assert page.locator("#quick-link-form").is_visible()
            assert page.evaluate(
                "getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()"
            ) == "#7A9E87"
            page.fill(
                '#quick-link-form input[name="url"]',
                f"http://127.0.0.1:{server.server_port}/v2/web/index.html",
            )
            page.click('#quick-link-form button')
            page.wait_for_selector('#new-form:not(.hidden)')
            page.fill('input[name="company"]', "Entreprise Mobile")
            page.fill('input[name="title"]', "Directeur des opérations")
            page.fill(
                'textarea[name="offer"]',
                (
                    "CDI basé à Laval. Direction avec autonomie, management, centre de profit, "
                    "budget, logistique, performance et transformation. Rémunération 80 k€. "
                )
                * 4,
            )
            page.set_input_files('input[name="logo"]', logo)
            page.click('#new-form button')
            page.wait_for_selector(".verdict")
            assert page.locator(".verdict b").inner_text() == "GO"
            assert page.locator("#candidate-now").inner_text() == "Marquer comme à candidater"
            assert not page.evaluate(
                "document.documentElement.scrollWidth > document.documentElement.clientWidth"
            )
            page.click('a[href^="#cv/"]')
            page.wait_for_selector(".cv-page")
            assert page.locator(".cv-ident h2").inner_text() == "DIRECTEUR DES OPÉRATIONS"
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#new")
            page.fill('input[name="url"]', f"http://127.0.0.1:{server.server_port}/v2/web/index.html")
            page.click('#link-form button')
            page.wait_for_selector('#new-form:not(.hidden)')
            page.fill('input[name="company"]', "Entreprise NO GO")
            page.fill('input[name="title"]', "Poste exécutant")
            page.fill('textarea[name="offer"]', "Poste exécutant sans autonomie. Tous les samedis obligatoires. Salaire 40 k€. " * 4)
            page.set_input_files('input[name="logo"]', logo)
            page.click('#new-form button')
            page.wait_for_selector("#candidate-anyway")
            assert "NO GO recommandé" in page.locator(".analysis-gate").inner_text()
            browser.close()
    finally:
        server.shutdown()
        thread.join(timeout=5)
