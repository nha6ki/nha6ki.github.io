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
