from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader


def render_pdf(html, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1120, "height": 1584})
        page.set_content(html, wait_until="networkidle")
        page.emulate_media(media="print")
        page.pdf(
            path=str(output_path),
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()
    pages = len(PdfReader(output_path).pages)
    if pages != 1:
        output_path.unlink(missing_ok=True)
        raise ValueError(f"Le CV généré occupe {pages} pages au lieu d'une")
    return pages
