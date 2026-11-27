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


def check(page):
    row = page.locator("#queue tr").filter(has_text="DEMO-INV-002")
    expect(row).to_contain_text("要確認", timeout=60_000)
    row.get_by_role("button", name="開く").click()
    expect(page.locator("#reconciliation")).to_contain_text("RCPT-001")
    page.locator("#sample-receipt").click()
    expect(row).to_contain_text("承認待ち")
    expect(page.locator("#reconciliation")).to_contain_text("RCPT-002")

    page.locator("#actor").fill("Browser test")
    page.locator("#note").fill("Checked the sample PDF")
    page.locator("#approve").click()
    expect(page.locator("#issues")).to_contain_text("原本の税込合計を入力")
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
    expect(row).to_contain_text("要確認", timeout=60_000)
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
                assert not errors, errors
                browser.close()
        finally:
            server.shutdown()
            thread.join()
    print("Invoice Review browser check passed")


if __name__ == "__main__":
    main()
