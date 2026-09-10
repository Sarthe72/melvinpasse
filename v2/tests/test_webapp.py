from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from PIL import Image
from playwright.sync_api import sync_playwright


LMM_URL = (
    "https://www.lmmhabitat.com/espace-recrutement"
    "#Directeur%20de%20la%20Proximit%C3%A9%20CDI%20/%20Directeur%20de%20la%20Proximit%C3%A9"
)


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
            assert page.locator("#sync-account").is_visible()
            assert page.evaluate(
                "getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()"
            ) == "#7A9E87"
            housing_analysis = page.evaluate(
                "analyze('Organisme gérant 14 000 logements. CDI. Direction, management, budget, performance et transformation.')"
            )
            assert housing_analysis["salary"] is None
            assert not any("14 000" in flag for flag in housing_analysis["redFlags"])
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
            assert page.locator(".verdict b").inner_text() == "À ÉTUDIER"
            assert page.locator("#candidate-now").inner_text() == "Candidater malgré les points à vérifier"
            assert page.get_by_role("heading", name="Pourquoi cette recommandation ?").is_visible()
            assert page.get_by_role("heading", name="Ce que l’employeur recherche").is_visible()
            assert page.get_by_role("heading", name="Correspondances expliquées").is_visible()
            assert page.locator(".match-details article").count() >= 4
            assert not page.evaluate(
                "document.documentElement.scrollWidth > document.documentElement.clientWidth"
            )
            page.click('a[href^="#cv/"]')
            page.wait_for_selector(".cv-page")
            assert page.locator(".cv-ident h2").inner_text() == "DIRECTEUR DES OPÉRATIONS"
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#dashboard")
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


def test_job_link_extraction_and_protected_source_fallback():
    repository_root = Path(__file__).resolve().parents[2]
    handler = partial(SimpleHTTPRequestHandler, directory=repository_root)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()

            def extractor(route, request):
                if "glassdoor" in request.post_data:
                    route.fulfill(
                        status=422,
                        content_type="application/json",
                        body='{"error":"SOURCE_PROTECTED","provider":"glassdoor.fr"}',
                    )
                else:
                    route.fulfill(
                        status=200,
                        content_type="application/json",
                        body=(
                            '{"title":"Directeur de la Proximité",'
                            '"company":"Le Mans Métropole Habitat",'
                                '"text":"CDI. Missions et responsabilités de direction. Profil recherché : '
                                'expérience en management, compétences de pilotage, gestion de budget et poste autonome. '
                                'La personne pilote les équipes de proximité, les indicateurs de performance et les '
                                'relations avec les partenaires. Elle organise les activités, conduit les projets de '
                                'transformation et garantit la qualité de service rendue aux habitants."}'
                        ),
                    )

            page.route("**/functions/v1/extract-offer", extractor)
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#new")
            page.fill('input[name="url"]', LMM_URL)
            page.click('#link-form button')
            page.wait_for_selector('#new-form:not(.hidden)')
            assert page.input_value('input[name="company"]') == "Le Mans Métropole Habitat"
            assert page.input_value('input[name="title"]') == "Directeur de la Proximité"
            assert "Annonce chargée" in page.locator("#link-help").inner_text()

            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#dashboard")
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#new")
            protected_url = "https://www.glassdoor.fr/job-listing/directeur-des-operations-JV_123.htm"
            page.fill('input[name="url"]', protected_url)
            page.click('#link-form button')
            page.wait_for_selector('#new-form:not(.hidden)')
            assert page.input_value('input[name="company"]') == ""
            assert page.input_value('input[name="title"]') == "Directeur Des Operations"
            assert "protège le contenu" in page.locator("#link-help").inner_text()
            assert page.input_value('textarea[name="offer"]') == ""
            browser.close()
    finally:
        server.shutdown()
        thread.join(timeout=5)
