"""Generate static Review assets from an explicitly selected InvoiceFlow checkout."""
import argparse
import json
import re
from pathlib import Path
import subprocess
import sys


def standardize_amount_labels(page):
    page = page.replace("純単価", "単価（税抜）")
    page = re.sub(r"単価(?!（税抜）)", "単価（税抜）", page)
    page = page.replace("税抜明細額", "明細金額（税抜）")
    page = re.sub(r"明細金額(?!（税抜）)|明細額", "明細金額（税抜）", page)
    return page.replace("税込合計", "請求総額（税込）")


def english_page(source):
    translations = json.loads(Path(__file__).with_name("invoice-review-en.json").read_text(encoding="utf-8"))
    pattern = "|".join(re.escape(key) for key in sorted(translations, key=len, reverse=True))
    page = re.sub(pattern, lambda match: translations[match.group()], source)
    if re.search(r"[ぁ-龯]", page):
        raise ValueError("Invoice Review contains untranslated interface text")
    return page.replace('lang="ja"', 'lang="en"', 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="InvoiceFlow checkout root")
    parser.add_argument("--check", action="store_true", help="Fail if generated files differ")
    args = parser.parse_args()
    source = args.source.resolve()
    target = Path(__file__).resolve().parents[1] / "public/projects/invoiceflow/review"
    generated = {name: (source / name).read_bytes()
                 for name in ("review_flow.py", "review_ui.py", "three_way.py", "transcription.py")}
    generated["index.html"] = subprocess.check_output(
        [sys.executable, "-c", "import public_review, sys; "
         "sys.stdout.buffer.write(public_review.public_html(browser=True).encode('utf-8'))"],
        cwd=source,
    )
    # Each browser tab owns its database. An action refreshes the queue after writing.
    refresh_button = '<button onclick="load()">一覧を更新</button>'.encode()
    generated["index.html"] = generated["index.html"].replace(refresh_button, b"")
    page = generated["index.html"].decode()
    page = page.replace('const sampleURL=window.invoiceReviewPDF?.(id);', 'const sampleURL=current.sample_source?"./"+current.sample_source.file:window.invoiceReviewPDF?.(id);')
    page = page.replace('const isImage=!sampleURL && current.document_type?.startsWith("image/");', 'const isImage=current.sample_source?.media_type?.startsWith("image/") || (!sampleURL && current.document_type?.startsWith("image/"));')
    page = page.replace('r.invoice.invoice_number,r.invoice.supplier', '(r.invoice.invoice_number??"未記載"),r.invoice.supplier')
    page = page.replace('"請求書 "+current.current.invoice_number', '"請求書 "+(current.current.invoice_number??current.current.supplier)')
    page = page.replace('r.invoice.gross_total+" "+r.invoice.currency', 'r.invoice.gross_total+" "+(r.invoice.currency??"通貨未記載")')
    page = page.replace('showStructure();', 'showStructure();showPublicSource(current.sample_source,current.id);')
    page = page.replace("編集内容は承認時に保存されます。発注値は取り込み時点の記録です。", "修正は保存ボタンで記録します。承認は別操作です。発注値は取り込み時点の記録です。")
    intro = '<section><h2>請求書を確認してCSV出力</h2><p>15件のサンプル請求書を確認できます。請求書を選び、原本と入力内容を比較してください。必要な箇所を修正し、「確認してCSV出力」を押すとダウンロードできます。</p><p class="muted">変更内容はこのタブ内のみで保持され、再読み込みや言語切替で初期状態に戻ります。このデモではAI抽出・Google Sheetsへの送信・支払処理は実行しません。</p>\n'
    page = re.sub(r'<section><h2>原本を確認してCSV出力</h2>.*?(?=<div hidden>)', lambda _: intro, page, count=1, flags=re.S)
    page = page.replace('</main>', '<footer class="muted"><a href="./public-samples.json">出典・ライセンス情報</a></footer></main>', 1)
    page = page.replace('review-client.js?v=single-action-1', 'review-client.js?v=concise-intro-1')
    generated["index.html"] = standardize_amount_labels(page).encode()
    generated["en.html"] = english_page(generated["index.html"].decode()).encode()
    if args.check:
        stale = [name for name, data in generated.items()
                 if not (target / name).is_file() or (target / name).read_bytes() != data]
        if stale:
            parser.exit(1, "Outdated Invoice Review assets: " + ", ".join(stale) + "\n")
    else:
        for name, data in generated.items():
            (target / name).write_bytes(data)


if __name__ == "__main__":
    main()
