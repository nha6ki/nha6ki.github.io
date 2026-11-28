"""Exercise the built Invoice Review page with its real browser worker."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright


SITE = Path(__file__).resolve().parents[1]
REVIEW = "/projects/invoiceflow/review/"
CDN = "https://cdn.jsdelivr.net/pyodide/v314.0.8/full/"


def check(page, english=False):
    expect(page.locator('header button[onclick="load()"]')).to_have_count(0)
    needs_review = "Matching needs review" if english else "照合要確認"
    expect(page.locator("#queue tr")).to_have_count(15, timeout=60_000)
    for supplier, number, media in [('Joe Shmoe', 8, 'pdf'), ('Sparksuite, Inc.', 9, 'pdf'), ('NI57721', 10, 'png'), ('Big Corp',11,'pdf'), ('Test Company',12,'pdf'), ('famoser GmbH',13,'pdf'), ('Sammy Maystone',14,'pdf'), ('Azure Interior',15,'pdf')]:
        page.locator('#queue tr').filter(has_text=supplier).get_by_role('button').click()
        expect(page.locator('#public-source-info')).to_contain_text(('Saved Qwen' if number >= 11 else 'manually transcribed') if english else ('Qwen' if number >= 11 else '手作業'))
        original = page.locator('#source-image' if media == 'png' else '#pdf')
        expect(original).to_have_attribute('src', f'./sample-{number}.{media}')
        response = page.request.get(original.evaluate('e => e.src'))
        assert response.ok
        assert response.body().startswith(b'\x89PNG' if media == 'png' else b'%PDF-')
    page.locator('#queue tr').filter(has_text='Big Corp').get_by_role('button').click()
    page.locator('#actor').fill('Browser test')
    page.locator('#note').fill('Test confirmation, not payment approval')
    page.locator('#source-checked').check()
    if page.locator('#exceptions-checked').is_visible():
        page.locator('#exceptions-checked').check()
    with page.expect_download() as downloading:
        page.locator('#confirm-transcription').click()
    expect(page.locator('#workflow-states')).to_contain_text('Transcription confirmed' if english else '転記確認済み')
    downloaded = Path(downloading.value.path()).read_text(encoding='utf-8-sig')
    assert 'not_approved' in downloaded and 'transcription_status' in downloaded
    page.locator('#lines tr').first.locator('[data-key="item"]').fill('Test edit')
    expect(page.locator('#confirm-transcription')).to_be_enabled()
    correction = page.locator("#queue tr").filter(has_text="F202600025")
    correction.get_by_role("button").click()
    expect(page.locator("#pdf")).to_have_attribute("src", "./sample-7.pdf")
    expect(page.locator('#lines tr').nth(3).locator('[data-key="unit_price"]')).to_have_value("0.00")
    page.locator('#lines tr').nth(3).locator('[data-key="unit_price"]').fill('')
    page.locator('#actor').fill('Demo reviewer')
    page.locator('#note').fill('Source line 4 has no printed unit price')
    page.locator('#source-checked').check()
    if page.locator('#exceptions-checked').is_visible():
        page.locator('#exceptions-checked').check()
    page.locator('#confirm-transcription').click()
    expect(page.locator('#history')).to_contain_text('save_draft', use_inner_text=False)
    correction.get_by_role('button').click()
    expect(page.locator('#lines tr').nth(3).locator('[data-key="unit_price"]')).to_have_value('')
    expect(page.locator('#approve, #validate, #ledger, #save-draft')).to_have_count(0)
    page.reload()
    expect(page.locator('#queue tr')).to_have_count(15, timeout=60_000)


def main():
    if not (SITE / "dist" / REVIEW.strip("/") / "index.html").is_file():
        raise SystemExit("Run npm run build before checking Invoice Review")
    handler = partial(SimpleHTTPRequestHandler, directory=SITE / "dist")
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as playwright:
                executable = os.environ.get("INVOICE_REVIEW_CHROMIUM")
                browser = playwright.chromium.launch(executable_path=executable)
                page = browser.new_page()
                runtime = os.environ.get("INVOICE_REVIEW_PYODIDE_DIR")
                if runtime:
                    def serve_runtime(route):
                        file = Path(runtime) / route.request.url.removeprefix(CDN)
                        route.fulfill(path=file, headers={"Access-Control-Allow-Origin": "*"})
                    page.context.route(CDN + "**", serve_runtime)
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}{REVIEW}")
                check(page)
                page.get_by_role("link", name="English", exact=True).click()
                expect(page.locator("html")).to_have_attribute("lang", "en")
                check(page, english=True)
                page.get_by_role("link", name="日本語", exact=True).click()
                expect(page.locator("html")).to_have_attribute("lang", "ja")
                assert not errors, errors
                browser.close()
        finally:
            server.shutdown()
            thread.join()
    print("Invoice Review browser check passed")


if __name__ == "__main__":
    main()