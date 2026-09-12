from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from PIL import Image
from playwright.sync_api import sync_playwright
from pypdf import PdfReader


LMM_URL = (
    "https://www.lmmhabitat.com/espace-recrutement"
    "#Directeur%20de%20la%20Proximit%C3%A9%20CDI%20/%20Directeur%20de%20la%20Proximit%C3%A9"
)
APEC_URL = "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/179398592W"


def test_apec_edge_function_keeps_public_search_fallback():
    source = (
        Path(__file__).resolve().parents[1]
        / "supabase"
        / "functions"
        / "extract-offer"
        / "index.ts"
    ).read_text(encoding="utf-8")
    assert 'fetch("https://www.apec.fr/cms/webservices/rechercheOffre"' in source
    assert "numeroOffre: offerNumber" in source
    assert 'source: "apec-search"' in source


def test_lmm_edge_function_isolates_selected_offer():
    source = (
        Path(__file__).resolve().parents[1]
        / "supabase"
        / "functions"
        / "extract-offer"
        / "index.ts"
    ).read_text(encoding="utf-8")
    assert "function selectedOfferText(" in source
    assert '"lmmhabitat.com"' in source
    assert "const focusedText =" in source


def test_mobile_browser_journey(tmp_path):
    repository_root = Path(__file__).resolve().parents[2]
    handler = partial(SimpleHTTPRequestHandler, directory=repository_root)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logo = tmp_path / "logo.png"
    Image.new("RGB", (120, 60), "#e73137").save(logo)
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
            interesting_salary = page.evaluate(
                "analyze('CDI. Salaire 60 k€ brut annuel. Direction avec autonomie, management, budget, performance et transformation.')"
            )
            assert interesting_salary["salary"] == 60000
            assert not any("Rémunération" in flag for flag in interesting_salary["redFlags"])
            assert any("seuil d’intérêt" in value for value in interesting_salary["strengths"])
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
            assert not page.locator("#export").is_visible()
            assert page.locator("#candidate-now").inner_text() == "Candidater malgré les points à vérifier"
            assert page.get_by_role("heading", name="Pourquoi cette recommandation ?").is_visible()
            assert page.get_by_role("heading", name="Ce que l’employeur recherche").is_visible()
            assert page.get_by_role("heading", name="Correspondances expliquées").is_visible()
            assert page.locator(".match-details article").count() >= 4
            assert not page.evaluate(
                "document.documentElement.scrollWidth > document.documentElement.clientWidth"
            )
            page.click('a[href^="#cv/"]')
            page.wait_for_selector(".cv-spie-page")
            assert page.locator(".spie-name h2").inner_text() == "DIRECTEUR DES OPÉRATIONS"
            assert page.locator(".spie-side").is_visible()
            assert page.locator(".spie-groups > div").count() == 5
            header_boxes = page.evaluate("""() => {
              const box = selector => document.querySelector(selector).getBoundingClientRect();
              const name = box('.spie-name');
              const logo = box('.spie-company-badge');
              const contact = box('.spie-contact');
              return {nameLeft:name.left,logoRight:logo.right,nameRight:name.right,contactLeft:contact.left};
            }""")
            assert header_boxes["logoRight"] <= header_boxes["nameLeft"] + 24
            assert header_boxes["nameRight"] <= header_boxes["contactLeft"]
            assert page.locator(".spie-side-bg").count() == 1
            assert page.locator(".spie-company-watermark").count() == 1
            assert page.evaluate("document.querySelector('.spie-main').scrollHeight <= document.querySelector('.spie-main').clientHeight")
            assert page.evaluate("document.querySelector('.spie-side').scrollHeight <= document.querySelector('.spie-side').clientHeight")
            first_id = page.evaluate("apps()[0].id")
            cv_pdf = tmp_path / "cv-personnalise.pdf"
            page.pdf(path=str(cv_pdf), format="A4", print_background=True, prefer_css_page_size=True)
            assert len(PdfReader(cv_pdf).pages) == 1
            cv_pdf_without_backgrounds = tmp_path / "cv-sans-arriere-plans.pdf"
            page.pdf(
                path=str(cv_pdf_without_backgrounds),
                format="A4",
                print_background=False,
                prefer_css_page_size=True,
            )
            assert len(PdfReader(cv_pdf_without_backgrounds).pages) == 1
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#letter/{first_id}")
            page.wait_for_selector(".letter-page")
            assert page.locator(".letter-watermark").count() == 1
            letter_pdf = tmp_path / "lettre-motivation.pdf"
            page.pdf(path=str(letter_pdf), format="A4", print_background=True, prefer_css_page_size=True)
            assert len(PdfReader(letter_pdf).pages) == 1
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
            current_id = page.evaluate("apps()[0].id")
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#kit/{current_id}")
            assert page.locator("#pdf-cv").is_visible()
            assert page.locator("#pdf-letter").is_visible()
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#pipeline")
            assert page.locator(".tracking-table tbody tr").count() == 2
            page.locator('.table-status[data-id="%s"]' % current_id).select_option("ENTRETIEN")
            assert page.evaluate("apps()[0].status") == "ENTRETIEN"
            page.goto(f"http://127.0.0.1:{server.server_port}/v2/web/#dashboard")
            assert page.locator(".kpi-link").count() == 4
            page.locator(".kpi-link").nth(2).click()
            page.wait_for_selector(".active-filter")
            assert page.locator(".active-filter").inner_text().startswith("Filtre : Entretien")
            assert page.locator(".tracking-table tbody tr").count() == 1
            assert page.locator(".tracking-table tbody tr").inner_text().find("Entreprise NO GO") >= 0
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
                elif "apec.fr" in request.post_data:
                    route.fulfill(
                        status=200,
                        content_type="application/json",
                        body=(
                            '{"title":"Directeur de site F/H","company":"PARTNAIRE",'
                            '"text":"CDI au Mans. Salaire 70 k€ brut annuel. Direction de site logistique. '
                            'Missions et responsabilités du poste. Profil recherché avec expérience et compétences en '
                            'Pilotage des activités opérationnelles, humaines et financières. Management des équipes, '
                            'budget, indicateurs de performance, gestion des flux, optimisation des stocks, sécurité, '
                            'amélioration continue, projets logistiques, normes QHSE, WMS, ERP et Lean Management."}'
                        ),
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
            page.fill('input[name="url"]', APEC_URL)
            page.click('#link-form button')
            page.wait_for_selector('#new-form:not(.hidden)')
            assert page.input_value('input[name="company"]') == "PARTNAIRE"
            assert page.input_value('input[name="title"]') == "Directeur de site F/H"
            assert "70 k€" in page.input_value('textarea[name="offer"]')
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
