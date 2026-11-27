"""Generate static Review assets from an explicitly selected InvoiceFlow checkout."""
import argparse
import json
import re
from pathlib import Path
import subprocess
import sys


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
                 for name in ("review_flow.py", "review_ui.py", "three_way.py")}
    generated["index.html"] = subprocess.check_output(
        [sys.executable, "-c", "import public_review, sys; "
         "sys.stdout.buffer.write(public_review.public_html(browser=True).encode('utf-8'))"],
        cwd=source,
    )
    # Each browser tab owns its database. An action refreshes the queue after writing.
    refresh_button = '<button onclick="load()">一覧を更新</button>'.encode()
    generated["index.html"] = generated["index.html"].replace(refresh_button, b"")
    generated["index.html"] = generated["index.html"].replace(
        "3件目の DEMO-INV-001 は、上記の40個を登録した請求書です。承認時の記録を参照できます。".encode(),
        "DEMO-INV-001 には40個を承認した記録があります。ほかの3件でも原本PDFと抽出値を比較できます。004は承認待ち、005は通貨、006は発注番号の確認が必要です。".encode(),
    )
    page = generated["index.html"].decode()
    page = page.replace("2件の請求書を照合する", "3つのレビュー操作を試す")
    page = page.replace("<ol>", '<ol><li><strong>空欄単価を修正する · F202600025</strong><br>原本の4行目の単価は空欄です。「未記載にする」を押し、確認者と理由を入力して「修正を保存（承認しない）」を押します。履歴を確認してください。階層明細の承認は保留されます。</li>', 1)
    page = page.replace('<p class="muted">処理はブラウザ内で行います。', '<p class="muted">UC12は報告されたモデル出力から再構成したサンプルです。この画面ではAI抽出やGoogle Sheets送信は実行しません。修正はこのタブ内に保存され、再読み込みや言語切替で初期状態に戻ります。</p><p class="muted">処理はブラウザ内で行います。')
    page = page.replace('<p class="muted">処理はブラウザ内で行います。', '<p><a href="./sample-7.pdf" target="_blank" rel="noopener">UC12原本PDF</a> · <a href="./sample-7-source.json">出典とサンプル作成情報</a></p><p class="muted">処理はブラウザ内で行います。')
    generated["index.html"] = page.encode()
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
