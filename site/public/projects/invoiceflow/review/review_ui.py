"""Local invoice review UI. Run beside review_flow.py; no extra packages."""
from contextlib import closing as _resource_closing
import argparse,json,secrets
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
import review_flow as flow

ROOT=Path(__file__).resolve().parent
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
    if not registered and flow.three_way.enabled(result["po"]):
        result.update(flow.assess(conn,result["current"],result["po"]))
    elif registered:
        result["reconciliation"]=next(
            (event["payload"].get("reconciliation",[]) for event in reversed(result["events"])
             if event["action"]=="approve"), [])
    name=Path(row["source"]).name
    for ending in (".stream.jsonl",".normalized.json",".json"):
        if name.endswith(ending):
            name=name[:-len(ending)];break
    result["pdf_available"]=(ROOT/"data"/(name+".pdf")).is_file()
    result["pdf_name"]=name+".pdf"
    return result

def shape(obj):
    if not isinstance(obj,dict) or not isinstance(obj.get("lines"),list):
        raise ValueError("Invoice needs an object and lines array")
    for item in [obj]+obj["lines"]:
        if not isinstance(item,dict) or any(isinstance(v,(dict,list)) for k,v in item.items() if k!="lines"):
            raise ValueError("Field values must be strings or null")
        if any(v is not None and not isinstance(v,str) for k,v in item.items() if k!="lines"):
            raise ValueError("Field values must be strings or null")

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
        try:
            with _resource_closing(flow.connect(self.server.db)) as conn, conn:
                if path=="/":
                    html=(ROOT/"review_ui.html").read_text().replace("__TOKEN__",self.server.token)
                    return self.reply(html.encode(),kind="text/html; charset=utf-8")
                if path=="/api/reviews":
                    rows=[]
                    for r in conn.execute("SELECT id FROM reviews ORDER BY id DESC"):
                        d=detail(conn,r["id"])
                        rows.append({k:d[k] for k in ("id","status","created")}|{"invoice":d["current"]})
                    return self.reply(rows)
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
                if path.startswith("/pdf/"):
                    d=detail(conn,int(path.rsplit("/",1)[-1]))
                    p=safe_path(d["pdf_name"],ROOT/"data")
                    return self.reply(p.read_bytes(),kind="application/pdf")
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
                    answer=safe_path(body["answer"]);po=safe_path(body["po"])
                    if not answer.name.endswith(".stream.jsonl") or po.parent!=ROOT/"fixtures":
                        raise ValueError("Choose a saved model stream and a PO fixture")
                    return self.reply(flow.ingest(conn,answer,json.loads(po.read_text()),bool(body.get("comma"))))
                id=int(body["id"]);obj=body["invoice"];shape(obj)
                if path=="/api/validate":
                    conn.execute("BEGIN")
                    row=conn.execute("SELECT po FROM reviews WHERE id=?",(id,)).fetchone()
                    if not row: raise ValueError("Review not found")
                    return self.reply(flow.assess(conn,obj,json.loads(row["po"])))
                if path=="/api/approve":
                    result=flow.approve(conn,id,body["actor"],body["note"],obj)
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
