"""Local invoice review UI. Run beside review_flow.py; no extra packages."""
from contextlib import closing as _resource_closing
import argparse,hashlib,json,secrets
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
import review_flow as flow
import transcription

ROOT=Path(__file__).resolve().parent
def render_html(mode="local"):
    html=(ROOT/"review_ui.html").read_text(encoding="utf-8")
    scope={
        "local":"確認内容と修正履歴はローカルDBに保存されます。CSV出力だけではGoogle Sheetsへ送信しません。",
        "browser":"変更内容はこのタブ内のみで保持され、再読み込みや言語切替で初期状態に戻ります。このデモではAI抽出・Google Sheetsへの送信・支払処理は実行しません。",
        "public":"サンプル以外の個人情報を入力しないでください。セッションは1時間操作がないと終了します。"
    }[mode]
    return (html.replace("__REVIEW_MODE__",mode)
            .replace("<!-- REVIEW_SCOPE -->",scope)
            .replace("<!-- REVIEW_COUNT -->","15件のサンプル請求書を確認できます。" if mode=="browser" else "")
            .replace("<!-- REVIEW_FOOTER -->",'<footer class="muted"><a href="./public-samples.json">出典・ライセンス情報</a></footer>' if mode=="browser" else ""))


def input_origin(answer_path, ident, document):
    # A filename alone is not proof that Qwen generated the values.
    source={"data_kind":"saved_data", "title":document[0].name if document else "", "notes":""}
    if document: source["original_url"]="/source/"+str(ident)
    try:
        report=safe_path(str(Path(answer_path).parent/"report.json"))
        metadata=json.loads(report.read_text(encoding="utf-8"))
        model=metadata.get("model") if isinstance(metadata,dict) else None
        if isinstance(model,str) and model.strip():
            source["data_kind"]="saved_model_output" if model.lower().startswith("qwen") else "model_output"
    except (OSError,ValueError,TypeError):
        pass
    return source

def safe_path(value,base=ROOT):
    p=(base/value).resolve()
    if not p.is_relative_to(base.resolve()) or not p.is_file():
        raise ValueError("File is not available within project")
    return p

def detail(conn,id):
    row=conn.execute("SELECT * FROM reviews WHERE id=?",(id,)).fetchone()
    if not row: raise ValueError("Review not found")
    result=dict(row)
    for k in ("raw","normalized","normalization","po","issues"): result[k]=json.loads(result[k])
    registered=conn.execute("SELECT invoice FROM ledger WHERE review_id=?",(id,)).fetchone()
    result["current"]=json.loads(registered[0]) if registered else result["normalized"]
    result["events"]=[]
    for r in conn.execute("SELECT * FROM events WHERE review_id=? ORDER BY id",(id,)):
        event=dict(r);event["payload"]=json.loads(event["payload"]);result["events"].append(event)
    result["requires_gross_confirmation"] = not registered and flow.three_way.enabled(result["po"])
    if not registered:
        assessment = flow.assess(conn, result["current"], result["po"], original=result["raw"])
        result.update(assessment)
        result["status"] = flow.readiness(assessment)
    elif registered:
        result["reconciliation"]=next(
            (event["payload"].get("reconciliation",[]) for event in reversed(result["events"])
             if event["action"]=="approve"), [])
    document = source_document(row["source"])
    result.update(document_available=document is not None,
                  document_name=document[0].name if document else None,
                  document_type=document[1] if document else None)
    result["pdf_available"] = document is not None and document[1] == "application/pdf"
    result["pdf_name"] = document[0].name if result["pdf_available"] else None
    result["input_origin"] = input_origin(row["source"],id,document)
    result["transcription"] = transcription.state(conn, id)
    return result

def source_document(answer_path):
    """Resolve a verified new source, or the historical data/<answer-stem>.pdf."""
    answer = Path(answer_path)
    name = answer.name
    for ending in (".stream.jsonl", ".normalized.json", ".json"):
        if name.endswith(ending):
            name = name[:-len(ending)]
            break
    metadata_path = answer.parent / (name + ".source.json")
    if metadata_path.exists():
        try:
            metadata_path = safe_path(str(metadata_path), ROOT)
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            filename = metadata["file"]
            if not isinstance(filename, str) or Path(filename).name != filename:
                return None
            source = safe_path(filename, metadata_path.parent)
            media = {".pdf": "application/pdf", ".png": "image/png",
                     ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}.get(source.suffix.lower())
            if not media or media != metadata["media_type"]:
                return None
            if hashlib.sha256(source.read_bytes()).hexdigest() != metadata["sha256"]:
                return None
            return source, media
        except (ValueError, OSError, KeyError, TypeError):
            return None
    try:
        return safe_path(name + ".pdf", ROOT / "data"), "application/pdf"
    except (ValueError, OSError):
        return None


def list_reviews(conn):
    rows = conn.execute("""
        SELECT r.id, r.created, r.status, r.normalized, r.po, r.raw, l.invoice
        FROM reviews r LEFT JOIN ledger l ON l.review_id=r.id ORDER BY r.id DESC
    """)
    result = []
    for row in rows:
        status = row["status"]
        invoice = json.loads(row["invoice"] or row["normalized"])
        if status != "registered":
            status = flow.readiness(flow.assess(conn, invoice, json.loads(row["po"]), original=json.loads(row["raw"])))
        result.append({"id": row["id"], "created": row["created"], "status": status, "invoice": invoice, "transcription": transcription.state(conn, row["id"])})
    return result


def validate_draft(conn, ident, invoice):
    flow.check_edited_invoice(invoice)
    row = conn.execute("SELECT po, raw FROM reviews WHERE id=?", (ident,)).fetchone()
    if not row:
        raise ValueError("Review not found")
    return flow.assess(conn, invoice, json.loads(row["po"]), original=json.loads(row["raw"]))


def approve_draft(conn, ident, invoice, body):
    return flow.approve(conn, ident, body["actor"], body["note"], invoice,
                        confirmed_gross_total=body.get("confirmed_gross_total"))


class Handler(BaseHTTPRequestHandler):
    def reply(self,data,status=200,kind="application/json; charset=utf-8"):
        content=data if isinstance(data,bytes) else json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status);self.send_header("Content-Type",kind)
        self.send_header("Content-Length",str(len(content)))
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff");self.end_headers()
        self.wfile.write(content)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=="/review_source.js":
            return self.reply((ROOT/"review_source.js").read_bytes(),kind="text/javascript; charset=utf-8")
        try:
            with _resource_closing(flow.connect(self.server.db)) as conn, conn:
                if path=="/":
                    html=render_html().replace("__TOKEN__",self.server.token)
                    return self.reply(html.encode(),kind="text/html; charset=utf-8")
                if path=="/api/reviews":
                    conn.execute("BEGIN")
                    return self.reply(list_reviews(conn))
                if path=="/api/ledger":
                    rows=[dict(r) for r in conn.execute("SELECT * FROM ledger ORDER BY id DESC")]
                    for r in rows:r["invoice"]=json.loads(r["invoice"])
                    return self.reply(rows)
                if path=="/api/files":
                    answers=sorted(str(p.relative_to(ROOT)) for folder in ROOT.glob("vision-results*") if folder.is_dir()
                        for p in folder.rglob("*.stream.jsonl") if p.resolve().is_relative_to(ROOT))
                    pos=sorted(str(p.relative_to(ROOT)) for p in (ROOT/"fixtures").glob("po*.json"))
                    return self.reply({"answers":answers,"pos":pos})
                if path.startswith("/api/review/"):
                    conn.execute("BEGIN")
                    return self.reply(detail(conn,int(path.rsplit("/",1)[-1])))
                if path.startswith(("/pdf/", "/source/")):
                    row = conn.execute("SELECT source FROM reviews WHERE id=?",
                                       (int(path.rsplit("/", 1)[-1]),)).fetchone()
                    document = source_document(row["source"]) if row else None
                    if document is None or (path.startswith("/pdf/") and document[1] != "application/pdf"):
                        raise ValueError("Source document is unavailable or has changed")
                    source, media = document
                    return self.reply(source.read_bytes(), kind=media)
            self.reply({"error":"Not found"},404)
        except (ValueError,OSError) as exc:self.reply({"error":str(exc)},404)
    def do_POST(self):
        if self.headers.get("X-Review-Token")!=self.server.token:
            return self.reply({"error":"Refresh this page before submitting"},403)
        try:
            size=int(self.headers.get("Content-Length","0"))
            if not 0<size<1_000_000:raise ValueError("Invalid request size")
            body=json.loads(self.rfile.read(size))
            path=urlparse(self.path).path
            with _resource_closing(flow.connect(self.server.db)) as conn, conn:
                if path=="/api/ingest":
                    answer=safe_path(body["answer"])
                    po=safe_path(body["po"]) if body.get("po") else None
                    if not answer.name.endswith(".stream.jsonl") or (po is not None and po.parent!=ROOT/"fixtures"):
                        raise ValueError("Choose a saved model stream and a PO fixture")
                    return self.reply(flow.ingest(conn,answer,json.loads(po.read_text()) if po else {"matching":"review_only","lines":[]},bool(body.get("comma"))))
                id=int(body["id"])
                if path=="/api/confirm-transcription":
                    return self.reply(transcription.confirm(conn, id, body))
                if path=="/api/export-transcription":
                    return self.reply(transcription.export_csv(conn, id, body["revision"]))
                obj=body["invoice"]
                if path=="/api/validate":
                    conn.execute("BEGIN")
                    return self.reply(validate_draft(conn, id, obj))
                if path=="/api/save-draft":
                    return self.reply(flow.save_draft(conn, id, body["actor"], body["note"],
                                                      obj, body["expected_current"]))
                if path=="/api/approve":
                    result=approve_draft(conn, id, obj, body)
                    return self.reply(result)
                return self.reply({"error":"Not found"},404)
        except (ValueError,TypeError,KeyError,OSError) as exc:
            self.reply({"error":str(exc)},400)

def server(db,port=8765):
    srv=ThreadingHTTPServer(("127.0.0.1",port),Handler)
    srv.db=db;srv.token=secrets.token_urlsafe(32)
    return srv
if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__);p.add_argument("--db",type=Path,default=ROOT/"review.sqlite")
    p.add_argument("--port",type=int,default=8765);a=p.parse_args()
    with _resource_closing(flow.connect(a.db)) as _resource_conn, _resource_conn:pass
    srv=server(a.db,a.port);print(f"Open http://localhost:{srv.server_port} (Ctrl+C to stop)",flush=True)
    try:srv.serve_forever()
    except KeyboardInterrupt:pass
    finally:srv.server_close()
