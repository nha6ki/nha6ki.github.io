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
    needs_review = "Needs review" if english else "要確認"
    expect(page.locator("#queue tr")).to_have_count(15, timeout=60_000)
    for supplier, number, media in [('Joe Shmoe', 8, 'pdf'), ('Sparksuite, Inc.', 9, 'pdf'), ('NI57721', 10, 'png'), ('Big Corp',11,'pdf'), ('Test Company',12,'pdf'), ('famoser GmbH',13,'pdf'), ('Sammy Maystone',14,'pdf'), ('Azure Interior',15,'pdf')]:
        page.locator('#queue tr').filter(has_text=supplier).get_by_role('button').click()
        expect(page.locator('#public-source-info')).to_contain_text('manually transcribed' if english else '手作業')
        expect(page.locator('#issues')).to_contain_text('No purchase order' if english else '発注')
        original = page.locator('#source-image' if media == 'png' else '#pdf')
        expect(original).to_have_attribute('src', f'./sample-{number}.{media}')
        response = page.request.get(original.evaluate('e => e.src'))
        assert response.ok
        assert response.body().startswith(b'\x89PNG' if media == 'png' else b'%PDF-')
    correction = page.locator("#queue tr").filter(has_text="F202600025")
    correction.get_by_role("button").click()
    expect(page.locator("#pdf")).to_have_attribute("src", "./sample-7.pdf")
    expect(page.locator('#lines tr').nth(3).locator('[data-key="unit_price"]')).to_have_value("0.00")
    page.locator('#lines tr').nth(3).get_by_role('button').click()
    page.locator('#actor').fill('Demo reviewer')
    page.locator('#note').fill('Source line 4 has no printed unit price')
    page.locator('#save-draft').click()
    expect(page.locator('#history')).to_contain_text('save_draft', use_inner_text=False)
    correction.get_by_role('button').click()
    expect(page.locator('#lines tr').nth(3).locator('[data-key="unit_price"]')).to_have_value('')
    expect(page.locator('#issues')).to_contain_text('Approval is blocked' if english else '承認できません')
    expect(page.locator('#ledger')).not_to_contain_text('F202600025')
    for number, field, correct in [(4, None, None), (5, "currency", "CAD"), (6, "po_number", "DEMO-PO-006")]:
        code = f"DEMO-INV-{number:03}"
        sample = page.locator("#queue tr").filter(has_text=code)
        ready = "Awaiting approval" if english else "承認待ち"
        expect(sample).to_contain_text(needs_review if field else ready)
        sample.get_by_role("button").click()
        expect(page.locator("#pdf")).to_have_attribute("src", f"./sample-{number}.pdf")
        response = page.request.get(page.locator("#pdf").evaluate("e => e.src"))
        assert response.ok and response.body().startswith(b"%PDF-")
        if field:
            page.locator(f"#f-{field}").fill(correct)
            page.get_by_role("button", name="Recheck" if english else "照合し直す", exact=True).click()
        page.locator("#actor").fill("Browser test")
        page.locator("#note").fill("Verified against sample invoice")
        page.locator("#approve").click()
        expect(page.locator("#ledger")).to_contain_text(code)
    row = page.locator("#queue tr").filter(has_text="DEMO-INV-002")
    expect(row).to_contain_text(needs_review, timeout=60_000)
    row.get_by_role("button", name="Open" if english else "開く").click()
    expect(page.locator("#reconciliation")).to_contain_text("RCPT-001")
    page.locator("#sample-receipt").click()
    expect(row).to_contain_text("Awaiting approval" if english else "承認待ち")
    expect(page.locator("#reconciliation")).to_contain_text("RCPT-002")

    page.locator("#actor").fill("Browser test")
    page.locator("#note").fill("Checked the sample PDF")
    page.locator("#approve").click()
    expect(page.locator("#issues")).to_contain_text("Enter the total including tax" if english else "原本の税込合計を入力")
    expect(page.locator("#ledger")).not_to_contain_text("DEMO-INV-002")
    page.locator("#confirmed-gross-total").fill("301.00")
    page.locator("#approve").click()
    expect(page.locator("#approve")).to_be_enabled()
    expect(page.locator("#ledger")).not_to_contain_text("DEMO-INV-002")
    page.locator("#confirmed-gross-total").fill("300.00")
    page.locator("#approve").click()
    expect(page.locator("#registered")).to_be_visible()
    expect(page.locator("#ledger")).to_contain_text("DEMO-INV-002")
    expect(page.locator("#history")).to_contain_text("reviewer_attestation", use_inner_text=False)

    page.reload()
    expect(row).to_contain_text(needs_review, timeout=60_000)
    expect(page.locator("#ledger")).not_to_contain_text("DEMO-INV-002")


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
                row = page.locator("#queue tr").filter(has_text="F202500003")
                row.get_by_role("button", name="Open").click()
                page.locator("#lines tr").first.locator('[data-key="line_total"]').fill("8000")
                page.get_by_role("button", name="Recheck", exact=True).click()
                expect(page.locator("#issues")).to_contain_text("Matching checks passed")
                page.locator("#actor").fill("Reviewer")
                page.locator("#note").fill("Verified net amount against the PDF")
                page.get_by_role("button", name="Approve and register").click()
                expect(page.locator("#ledger")).to_contain_text("F202500003")
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
