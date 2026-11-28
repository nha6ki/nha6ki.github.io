"""Browser transport for InvoiceFlow's original review UI and SQLite logic."""
import json
from pathlib import Path

import review_flow as flow
import review_ui as ui
import three_way

FIXTURES = json.loads(Path("fixtures.json").read_text(encoding="utf-8"))
for name, data in FIXTURES.items():
    file = Path(name)
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(data), encoding="utf-8")

PO = FIXTURES["fixtures/po-three-way.json"]
SAMPLES = "fixtures/three-way/"
AMOUNT = "fixtures/amount-review/UC1_F202500003_00-INV_20250701_EN16931_FX.json"
db = flow.connect(":memory:")
three_way.add_receipt(db, PO, FIXTURES[SAMPLES + "receipt-1.json"], flow.num, flow.now)
first = flow.ingest(db, Path(SAMPLES + "invoice-1.json"), PO, False)
if flow.approve(db, first["id"], "Demo", "Opening approval", confirmed_gross_total="400.00")["status"] != "registered":
    raise RuntimeError("Could not seed the prior approval")
flow.ingest(db, Path(SAMPLES + "invoice-2.json"), PO, False)
flow.ingest(db, Path(AMOUNT), FIXTURES["fixtures/po-uc1.json"], False)

for number in ("004", "005", "006"):
    source = Path(f"fixtures/practice/DEMO-INV-{number}.json")
    order = FIXTURES[f"fixtures/practice/DEMO-PO-{number}.json"]
    flow.ingest(db, source, order, False)


# Reconstructed from the user-reported model output; not the original stream file.
flow.ingest(db, Path("fixtures/correction/UC12.json"), {"matching": "review_only", "lines": []}, True)


PUBLIC_SOURCES = {}
for source in FIXTURES["fixtures/public-layouts/sources.json"]:
    result = flow.ingest(db, Path(source["fixture"]), {"matching": "review_only", "lines": []}, False)

    saved = FIXTURES.get("fixtures/public-layouts/model-reviews.json", {}).get(source["file"])
    if saved:
        for event in saved["history"]:
            flow.save_draft(db, result["id"], event["actor"],
                "Imported local correction (" + event["created"] + "): " + event["note"],
                event["after"], event["before"])
        row = db.execute("SELECT normalized FROM reviews WHERE id=?", (result["id"],)).fetchone()
        if json.loads(row["normalized"]) != saved["current"]:
            raise ValueError("Imported correction history mismatch")

    PUBLIC_SOURCES[result["id"]] = source


def handle(path, body):
    if path == "/api/files":
        return {"answers": [], "pos": []}
    if path == "/api/reviews":
        return ui.list_reviews(db)
    if path == "/api/ledger":
        return [dict(row) | {"invoice": json.loads(row["invoice"])}
                for row in db.execute("SELECT * FROM ledger ORDER BY id DESC")]
    if path.startswith("/api/review/"):
        ident = int(path.rsplit("/", 1)[-1])
        return ui.detail(db, ident) | {"sample_source": PUBLIC_SOURCES.get(ident)}
    if path == "/api/demo/receipt":
        return three_way.add_receipt(db, PO, FIXTURES[SAMPLES + "receipt-2.json"], flow.num, flow.now)
    if path == "/api/validate":
        return ui.validate_draft(db, body["id"], body["invoice"])
    if path == "/api/save-draft":
        return flow.save_draft(db, body["id"], body["actor"], body["note"],
                               body["invoice"], body["expected_current"])
    if path == "/api/approve":
        return ui.approve_draft(db, body["id"], body["invoice"], body)
    raise ValueError("この操作は公開版では利用できません。")


def request(path, payload):
    try:
        result = {"value": handle(path, json.loads(payload))}
    except (ValueError, TypeError, KeyError, AttributeError, ArithmeticError) as exc:
        result = {"error": str(exc)}
    return json.dumps(result, ensure_ascii=False)
