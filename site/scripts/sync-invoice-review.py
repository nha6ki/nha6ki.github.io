"""Generate static Review assets from an explicitly selected InvoiceFlow checkout."""
import argparse
from pathlib import Path
import subprocess
import sys


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
