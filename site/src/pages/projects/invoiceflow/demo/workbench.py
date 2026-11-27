"""Browser adapter for the InvoiceFlow core at commit 8f38358."""
from pathlib import Path
import json
import review_flow as flow
import three_way

session = None


def ingest(conn, po, invoice):
    path = Path("/tmp/invoiceflow-input.json")
    path.write_text(json.dumps(invoice), encoding="utf-8")
    return flow.ingest(conn, path, po, False)["id"]


def object_with_lines(value, label):
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be a JSON object")
    lines = value.get("lines")
    if not isinstance(lines, list) or not lines or any(not isinstance(line, dict) for line in lines):
        raise ValueError(f"{label} must contain a nonempty lines array of objects")
    return value


def start(payload):
    global session
    setup = payload["setup"]
    po = object_with_lines(setup["order"], "Order")
    flow.check_po(po)
    if not three_way.enabled(po):
        raise ValueError("Order matching must be three_way")
    for key in ("receipts", "prior_invoices"):
        if not isinstance(setup[key], list):
            raise ValueError(f"{key} must be an array")
    invoice = object_with_lines(payload["invoice"], "Invoice")
    candidate = flow.connect(":memory:")
    try:
        for receipt in setup["receipts"]:
            three_way.add_receipt(candidate, po, receipt, flow.num, flow.now)
        for prior in setup["prior_invoices"]:
            object_with_lines(prior, "Prior invoice")
            previous_id = ingest(candidate, po, prior)
            outcome = flow.approve(candidate, previous_id, "Demo seed", "Opening approval balance")
            if outcome["status"] != "registered" or outcome.get("reused"):
                raise ValueError(f"Prior invoice could not be registered: {outcome}")
        review_id = ingest(candidate, po, invoice)
        if candidate.execute("SELECT status FROM reviews WHERE id=?", (review_id,)).fetchone()[0] == "registered":
            raise ValueError("The invoice exactly duplicates a prior approval")
        result = snapshot(candidate, po, review_id, invoice)
    except Exception:
        candidate.close()
        raise
    if session:
        session[0].close()
    session = candidate, po, review_id
    return result


def snapshot(conn, po, review_id, invoice, outcome=None, receipt=None):
    row = conn.execute("SELECT status,raw FROM reviews WHERE id=?", (review_id,)).fetchone()
    registered = row[0] == "registered"
    events = []
    for event in conn.execute("SELECT action,actor,note,payload,created FROM events WHERE review_id=? ORDER BY id",
                              (review_id,)):
        entry = dict(event)
        entry["payload"] = json.loads(entry["payload"])
        events.append(entry)
    if registered:
        approval = events[-1]["payload"]
        assessment = {"issues": [], "reconciliation": approval["reconciliation"]}
    else:
        normalized, _ = flow.normalize(invoice, False)
        assessment = flow.assess(conn, normalized, po)
        if not assessment["issues"]:
            prior = conn.execute("SELECT 1 FROM ledger WHERE supplier=? AND invoice_number=?",
                                 (normalized["supplier"], normalized["invoice_number"])).fetchone()
            if prior:
                assessment["issues"].append({"field": "invoice_number", "reason": "duplicate_invoice"})
    return {
        "status": "registered" if registered else ("needs_review" if assessment["issues"] else "ready_for_approval"),
        **assessment, "events": events, "outcome": outcome, "receipt": receipt,
        "engine_commit": "8f3835845c92e94a4461ac3d1ec7f7aacd22643e",
        "order": po,
        "original_invoice": json.loads(row["raw"]),
        "reviewed_invoice": events[-1]["payload"]["after"] if registered else invoice,
        "invoice_number": (events[-1]["payload"]["after"] if registered else invoice).get("invoice_number"),
    }


def dispatch(action, payload):
    if action == "start":
        return start(payload)
    if session is None:
        raise ValueError("Start a review first")
    conn, po, review_id = session
    invoice = object_with_lines(payload["invoice"], "Invoice")
    before = snapshot(conn, po, review_id, invoice)
    if before["status"] == "registered" or action == "check":
        return before
    if action == "receipt":
        receipt = three_way.add_receipt(conn, po, payload["receipt"], flow.num, flow.now)
        return snapshot(conn, po, review_id, invoice, receipt=receipt)
    if action == "approve":
        normalized, _ = flow.normalize(invoice, False)
        outcome = flow.approve(conn, review_id, "Demo reviewer", payload["note"], normalized)
        return snapshot(conn, po, review_id, invoice, outcome=outcome["status"])
    raise ValueError("Unknown action")


def run_action(action, payload):
    try:
        return json.dumps(dispatch(action, json.loads(payload)), ensure_ascii=False)
    except (ValueError, KeyError, TypeError, AttributeError, ArithmeticError) as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False)
