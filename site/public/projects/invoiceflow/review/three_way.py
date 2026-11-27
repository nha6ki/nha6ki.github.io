"""Receipt records and cumulative quantity checks for explicitly opted-in POs."""

import json

SCHEMA = """
CREATE TABLE IF NOT EXISTS receipt_orders (
  order_key TEXT PRIMARY KEY, snapshot TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS receipts (
  order_key TEXT NOT NULL, receipt_id TEXT NOT NULL, lines TEXT NOT NULL,
  created TEXT NOT NULL, PRIMARY KEY(order_key, receipt_id));
"""

IDENTITY = ("supplier", "currency", "po_number")


def order_key(po):
    return json.dumps([po[k] for k in IDENTITY], ensure_ascii=False)


def enabled(po):
    return po.get("matching") == "three_way"


def bind_order(conn, po):
    key = order_key(po)
    if enabled(po):
        snapshot = json.dumps(po, sort_keys=True, ensure_ascii=False)
        conn.execute("INSERT OR IGNORE INTO receipt_orders VALUES (?,?)", (key, snapshot))
        if conn.execute("SELECT snapshot FROM receipt_orders WHERE order_key=?", (key,)).fetchone()[0] != snapshot:
            raise ValueError("Three-way PO snapshot differs from the registered order")
    elif conn.execute("SELECT 1 FROM receipt_orders WHERE order_key=?", (key,)).fetchone():
        raise ValueError("This PO requires three-way matching")
    return key


def add_receipt(conn, po, receipt, num, now):
    if not enabled(po):
        raise ValueError("Receipt requires a three-way PO")
    if not isinstance(receipt, dict):
        raise ValueError("Receipt must be an object")
    receipt_id = receipt.get("receipt_id")
    lines = receipt.get("lines")
    if not isinstance(receipt_id, str) or not receipt_id.strip() or receipt_id != receipt_id.strip():
        raise ValueError("Invalid receipt ID")
    if not isinstance(lines, list) or not lines:
        raise ValueError("Receipt requires lines")
    ordered = {line["item"]: line for line in po["lines"]}
    quantities = {}
    for line in lines:
        if not isinstance(line, dict) or not isinstance(line.get("item"), str):
            raise ValueError("Receipt requires an item name")
        item = line["item"]
        quantity = num(line.get("quantity"))
        if item not in ordered or item in quantities or quantity <= 0:
            raise ValueError("Receipt lines require unique ordered items and positive quantities")
        decimal_text = format(quantity, "f")
        quantities[item] = decimal_text.rstrip("0").rstrip(".") if "." in decimal_text else decimal_text
    payload = json.dumps(quantities, sort_keys=True)
    with conn:
        conn.execute("BEGIN IMMEDIATE")
        key = bind_order(conn, po)
        prior = conn.execute("SELECT lines FROM receipts WHERE order_key=? AND receipt_id=?",
                             (key, receipt_id)).fetchone()
        if prior and prior[0] != payload:
            raise ValueError("Receipt ID already exists with different quantities")
        if not prior:
            conn.execute("INSERT INTO receipts VALUES (?,?,?,?)", (key, receipt_id, payload, now()))
    return {"receipt_id": receipt_id, "reused": bool(prior)}


def inspect(conn, obj, po, num):
    """Return line evidence from the current database snapshot."""
    key = order_key(po)
    issues, evidence = [], []
    ordered = {line["item"]: num(line["quantity"]) for line in po["lines"]}
    receipts = [(row[0], json.loads(row[1])) for row in conn.execute(
        "SELECT receipt_id,lines FROM receipts WHERE order_key=? ORDER BY receipt_id", (key,))]
    approved = []
    for row in conn.execute(
        """SELECT l.invoice,r.po FROM ledger l JOIN reviews r ON r.id=l.review_id
           WHERE l.supplier=? ORDER BY l.id""", (po["supplier"],)
    ):
        invoice = json.loads(row[0])
        if any(invoice.get(k) != po[k] for k in IDENTITY):
            continue
        if not enabled(json.loads(row[1])):
            return [{"field": "lines", "reason": "legacy_approval_exists"}], []
        approved.append(invoice)

    for index, line in enumerate(obj["lines"], 1):
        item = line["item"]
        receipt_ids = [receipt_id for receipt_id, quantities in receipts if item in quantities]
        received = sum((num(q[item]) for _, q in receipts if item in q), num("0"))
        previous = [(invoice["invoice_number"], num(prior["quantity"]))
                    for invoice in approved for prior in invoice["lines"] if prior["item"] == item]
        billed = sum((quantity for _, quantity in previous), num("0"))
        requested = num(line["quantity"])
        balance = min(ordered[item], received) - billed
        excess = max(requested - balance, num("0"))
        evidence.append({
            "item": item, "ordered": str(ordered[item]), "received": str(received),
            "approved": str(billed), "requested": str(requested), "available": str(balance),
            "excess": str(excess), "receipt_ids": receipt_ids,
            "prior_invoices": [invoice_number for invoice_number, _ in previous],
        })
        if excess:
            issues.append({"field": f"line[{index}].quantity", "reason": "quantity_exceeds_available"})
    return issues, evidence
