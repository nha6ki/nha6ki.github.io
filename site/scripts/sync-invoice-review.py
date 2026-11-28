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
                 for name in ("review_flow.py", "review_ui.py", "three_way.py", "transcription.py", "review_source.js")}
    generated["index.html"] = subprocess.check_output(
        [sys.executable, "-c", "import public_review, sys; "
         "sys.stdout.buffer.write(public_review.public_html(browser=True).encode('utf-8'))"],
        cwd=source,
    )
    generated["index.html"] = standardize_amount_labels(generated["index.html"].decode()).encode()
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
