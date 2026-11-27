"""Stage 3: ingest saved LOCAL MODEL answers, validate, review and register."""
from contextlib import closing as _resource_closing
import argparse
import copy
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import re
import sqlite3

import three_way

FIELDS=("invoice_number","issue_date","supplier","currency","po_number","gross_total")
NUMBERS=("quantity","unit_price","line_total")
def dump(value):
    return json.dumps(value,ensure_ascii=False,indent=2)
def now():
    return datetime.now(timezone.utc).isoformat()
def connect(path):
    conn=sqlite3.connect(path)
    conn.row_factory=sqlite3.Row
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS reviews(
      id INTEGER PRIMARY KEY, source_hash TEXT UNIQUE NOT NULL, source TEXT NOT NULL,
      raw TEXT NOT NULL, normalized TEXT NOT NULL, normalization TEXT NOT NULL,
      po TEXT NOT NULL, issues TEXT NOT NULL, status TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(
      id INTEGER PRIMARY KEY, review_id INTEGER NOT NULL, actor TEXT NOT NULL,
      note TEXT NOT NULL, action TEXT NOT NULL, payload TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ledger(
      id INTEGER PRIMARY KEY, review_id INTEGER UNIQUE NOT NULL,
      supplier TEXT NOT NULL, invoice_number TEXT NOT NULL, invoice TEXT NOT NULL,
      created TEXT NOT NULL, UNIQUE(supplier,invoice_number));
    """)
    conn.executescript(three_way.SCHEMA)
    return conn

def read_answer(path):
    if path.name.endswith(".stream.jsonl"):
        chunks=[json.loads(l) for l in path.read_text().splitlines() if l.strip()]
        if not chunks or not chunks[-1].get("done") or chunks[-1].get("done_reason")=="length":
            raise ValueError("Incomplete generation stream")
        return json.loads("".join(c.get("response","") for c in chunks))
    return json.loads(path.read_text())

def normalize(raw, comma):
    obj=copy.deepcopy(raw); changes=[]
    if not isinstance(obj,dict):
        raise ValueError("Invoice must be an object")
    supplier=obj.get("supplier")
    if isinstance(supplier,dict) and isinstance(supplier.get("legal_name"),str):
        obj["supplier"]=supplier["legal_name"]
        changes.append({"field":"supplier","before":supplier,"after":obj["supplier"]})
    for label,container,keys in [("invoice",obj,("gross_total",))]+[
        (f"line[{i}]",line,NUMBERS) for i,line in enumerate(obj.get("lines",[]),1) if isinstance(line,dict)]:
        for key in keys:
            before=container.get(key); value=before
            if isinstance(value,(int,float)) and not isinstance(value,bool):
                value=str(value)
            if isinstance(value,str):
                value=value.strip()
                # Explicit source decimal convention. Never guess separator from expected values.
                if comma and re.fullmatch(r"-?\d+,\d+",value):
                    value=value.replace(",",".")
            if value!=before:
                container[key]=value
                changes.append({"field":f"{label}.{key}","before":before,"after":value})
    return obj,changes

def num(value):
    if not isinstance(value,str) or not re.fullmatch(r"-?\d+(?:\.\d+)?",value):
        raise ValueError(f"Invalid decimal: {value!r}")
    return Decimal(value)

def validate(obj,po):
    issues=[]
    match_receipts = three_way.enabled(po)
    for key in FIELDS:
        if key not in obj or not isinstance(obj[key],str) or not obj[key].strip():
            issues.append({"field":key,"reason":"missing_or_invalid"})
    try:
        datetime.strptime(obj.get("issue_date",""),"%Y-%m-%d")
    except (ValueError,TypeError):
        issues.append({"field":"issue_date","reason":"invalid_date"})
    try:
        num(obj.get("gross_total"))
    except ValueError:
        issues.append({"field":"gross_total","reason":"invalid_decimal"})
    lines=obj.get("lines")
    if not isinstance(lines,list) or not lines:
        return issues+[{"field":"lines","reason":"missing_or_invalid"}]
    for i,line in enumerate(lines,1):
        if not isinstance(line,dict):
            issues.append({"field":f"line[{i}]","reason":"invalid_object"}); continue
        for key in ("item","line_id"):
            if not isinstance(line.get(key),str) or not line[key].strip():
                issues.append({"field":f"line[{i}].{key}","reason":"missing_or_invalid"})
        values={}
        for key in NUMBERS:
            try: values[key]=num(line.get(key))
            except ValueError: issues.append({"field":f"line[{i}].{key}","reason":"invalid_decimal","actual":line.get(key)})
        if match_receipts and "quantity" in values and values["quantity"] <= 0:
            issues.append({"field":f"line[{i}].quantity","reason":"nonpositive_quantity"})
        if len(values)==3:
            calculated = values["quantity"] * values["unit_price"]
            actual = values["line_total"]
            if abs(calculated - actual) > Decimal(".01"):
                issues.append({
                    "field": f"line[{i}].line_total", "reason": "arithmetic_mismatch",
                    "quantity": format(values["quantity"], "f"),
                    "unit_price": format(values["unit_price"], "f"),
                    "expected": format(calculated, "f"),
                    "actual": format(actual, "f"),
                    "difference": format(actual - calculated, "f"),
                })
    try:
        if not match_receipts and num(obj.get("gross_total")) != num(po.get("gross_total")):
            issues.append({"field":"gross_total","reason":"po_mismatch","expected":po["gross_total"],"actual":obj.get("gross_total")})
    except ValueError:
        pass
    for key in ("po_number","supplier","currency"):
        if obj.get(key)!=po.get(key):
            issues.append({"field":key,"reason":"po_mismatch","expected":po.get(key),"actual":obj.get(key)})
    expected=po.get("lines",[])
    names=[l.get("item") for l in lines if isinstance(l,dict)]
    order_names=[l.get("item") for l in expected]
    # Initial scope: exact unique item names; no fuzzy auto-match.
    if any(not isinstance(name,str) for name in names):
        return issues
    if len(names)!=len(set(names)) or len(order_names)!=len(set(order_names)):
        issues.append({"field":"lines","reason":"ambiguous_item_names"})
        return issues
    if (set(names) - set(order_names)) or (not match_receipts and set(names)!=set(order_names)):
        issues.append({"field":"lines","reason":"item_set_mismatch"})
    lookup={l["item"]:l for l in expected}
    for i,line in enumerate(lines,1):
        if not isinstance(line,dict) or line.get("item") not in lookup: continue
        for key in (("unit_price",) if match_receipts else NUMBERS):
            try:
                target=num(lookup[line["item"]].get(key)); actual=num(line.get(key))
                if target!=actual: issues.append({"field":f"line[{i}].{key}","reason":"po_mismatch","expected":str(target),"actual":str(actual)})
            except ValueError:
                pass # Already invalid invoice field; malformed PO handled by CLI below.
    return issues

def check_po(po):
    if "matching" in po and not three_way.enabled(po):
        raise ValueError("Unknown PO matching mode")
    for key in ("supplier","currency","po_number"):
        if not isinstance(po.get(key),str) or not po[key].strip(): raise ValueError("Invalid PO "+key)
    if not isinstance(po.get("lines"),list) or not po["lines"]: raise ValueError("PO needs lines")
    if not three_way.enabled(po):
        num(po.get("gross_total"))
    names = set()
    for line in po["lines"]:
        if not isinstance(line.get("item"),str): raise ValueError("PO needs item")
        for key in NUMBERS: num(line.get(key))
        if three_way.enabled(po) and (not line["item"].strip() or line["item"] in names or num(line["quantity"]) <= 0):
            raise ValueError("Three-way PO requires unique items and positive quantities")
        names.add(line["item"])

def assess(conn,obj,po):
    issues = validate(obj,po)
    if not three_way.enabled(po):
        key = three_way.order_key(po)
        if conn.execute("SELECT 1 FROM receipt_orders WHERE order_key=?", (key,)).fetchone():
            issues.append({"field":"po_number","reason":"three_way_required"})
    if issues or not three_way.enabled(po):
        return {"issues": issues, "reconciliation": []}
    issues, evidence = three_way.inspect(conn,obj,po,num)
    return {"issues": issues, "reconciliation": evidence}


def ingest(conn,path,po,comma):
    check_po(po)
    raw=read_answer(path)
    digest=hashlib.sha256(dump(raw).encode()).hexdigest()
    with conn:
        conn.execute("BEGIN IMMEDIATE")
        prior=conn.execute("SELECT id,status FROM reviews WHERE source_hash=?",(digest,)).fetchone()
        if prior: return {"id":prior["id"],"status":prior["status"],"reused":True}
        three_way.bind_order(conn,po)
        obj,changes=normalize(raw,comma)
        issues=assess(conn,obj,po)["issues"]
        status="needs_review" if issues else "ready_for_approval"
        cur=conn.execute("INSERT INTO reviews(source_hash,source,raw,normalized,normalization,po,issues,status,created) VALUES(?,?,?,?,?,?,?,?,?)",
            (digest,str(path),dump(raw),dump(obj),dump(changes),dump(po),dump(issues),status,now()))
        conn.execute("INSERT INTO events(review_id,actor,note,action,payload,created) VALUES(?,?,?,?,?,?)",
            (cur.lastrowid,"system","Saved model answer and PO snapshot","ingest",dump(changes),now()))
    return {"id":cur.lastrowid,"status":status,"issues":issues}

def approve(conn,id,actor,note,corrected=None):
    if not actor.strip() or not note.strip(): raise ValueError("Actor and note required")
    with conn:
        conn.execute("BEGIN IMMEDIATE")
        row=conn.execute("SELECT * FROM reviews WHERE id=?",(id,)).fetchone()
        if row is None: raise ValueError("Review does not exist")
        if row["status"]=="registered": return {"id":id,"status":"registered","reused":True}
        obj=corrected if corrected is not None else json.loads(row["normalized"])
        po = json.loads(row["po"])
        assessment = assess(conn,obj,po)
        if any(issue["reason"] != "quantity_exceeds_available" for issue in assessment["issues"]):
            return {"id":id,"status":"needs_review",**assessment}
        existing=conn.execute("SELECT review_id FROM ledger WHERE supplier=? AND invoice_number=?",
            (obj["supplier"],obj["invoice_number"])).fetchone()
        if existing: return {"id":id,"status":"duplicate_invoice","existing_review":existing["review_id"]}
        if assessment["issues"]:
            return {"id":id,"status":"needs_review",**assessment}
        conn.execute("INSERT INTO ledger(review_id,supplier,invoice_number,invoice,created) VALUES(?,?,?,?,?)",
            (id,obj["supplier"],obj["invoice_number"],dump(obj),now()))
        conn.execute("UPDATE reviews SET status='registered' WHERE id=?",(id,))
        conn.execute("INSERT INTO events(review_id,actor,note,action,payload,created) VALUES(?,?,?,?,?,?)",
            (id,actor,note,"approve",dump({"before":json.loads(row["normalized"]),"after":obj,"reconciliation":assessment["reconciliation"]}),now()))
    return {"id":id,"status":"registered"}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--db",type=Path,default=Path("review.sqlite"))
    sub=p.add_subparsers(dest="command",required=True)
    i=sub.add_parser("ingest"); i.add_argument("answer",type=Path); i.add_argument("--po",type=Path,required=True)
    i.add_argument("--decimal-comma",action="store_true")
    rec=sub.add_parser("receive")
    rec.add_argument("receipt",type=Path)
    rec.add_argument("--po",type=Path,required=True)
    sub.add_parser("list"); sub.add_parser("ledger")
    sh=sub.add_parser("show"); sh.add_argument("id",type=int)
    ap=sub.add_parser("approve"); ap.add_argument("id",type=int); ap.add_argument("--actor",required=True); ap.add_argument("--note",required=True)
    ap.add_argument("--corrected",type=Path)
    a=p.parse_args()
    with _resource_closing(connect(a.db)) as conn, conn:
        if a.command=="ingest": result=ingest(conn,a.answer,json.loads(a.po.read_text()),a.decimal_comma)
        elif a.command=="receive":
            po=json.loads(a.po.read_text())
            check_po(po)
            result=three_way.add_receipt(conn,po,json.loads(a.receipt.read_text()),num,now)
        elif a.command=="approve": result=approve(conn,a.id,a.actor,a.note,json.loads(a.corrected.read_text()) if a.corrected else None)
        elif a.command=="show":
            row=conn.execute("SELECT * FROM reviews WHERE id=?",(a.id,)).fetchone()
            if row is None: raise SystemExit("Review not found")
            result=dict(row)
            for key in ("raw","normalized","normalization","po","issues"): result[key]=json.loads(result[key])
            result["events"]=[dict(r) for r in conn.execute("SELECT * FROM events WHERE review_id=? ORDER BY id",(a.id,))]
        else:
            query="SELECT id,source,status,created FROM reviews ORDER BY id" if a.command=="list" else "SELECT * FROM ledger ORDER BY id"
            result=[dict(r) for r in conn.execute(query)]
    print(dump(result))
if __name__=="__main__":
    main()
