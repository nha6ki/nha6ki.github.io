/* Transport for the original Invoice Review page. Requests stay in this tab. */
(() => {
  let worker;
  let unusable = false;
  let requestId = 0;
  const pending = new Map();
  const english = document.documentElement.lang === "en";
  const switcher = document.createElement("a");
  switcher.href = english ? "./" : "./en.html";
  switcher.lang = switcher.hreflang = english ? "ja" : "en";
  switcher.textContent = english ? "日本語" : "English";
  switcher.style.color = "inherit";
  document.querySelector("header > div").append(" · ", switcher);
  const loadError = english ? "Could not load the matching engine. Check your connection and reload the page." : "照合エンジンを読み込めませんでした。ネット接続を確認してページを再読み込みしてください。";

  function stop() {
    unusable = true;
    worker?.terminate();
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(Error(loadError));
    }
    pending.clear();
  }

  window.invoiceReviewRequest = (path, body) => new Promise((resolve, reject) => {
    if (unusable) {
      reject(Error(loadError));
      return;
    }
    if (!worker) {
      try {
        worker = new Worker(new URL("./review-worker.mjs?v=review-stages-2", document.baseURI), { type: "module" });
      } catch {
        stop();
        reject(Error(loadError));
        return;
      }
      worker.onerror = stop;
      worker.onmessageerror = stop;
      worker.onmessage = ({ data }) => {
        if (data.fatal) {
          stop();
          return;
        }
        const entry = pending.get(data.id);
        if (!entry) return;
        pending.delete(data.id);
        clearTimeout(entry.timer);
        if (data.error !== undefined) entry.reject(Error(english ? ({"照合を完了できませんでした。ページを再読み込みしてやり直してください。": "Could not complete the check. Reload the page and try again.", "別の画面で修正されています。開き直して確認してください。": "This review changed elsewhere. Reopen it before saving.", "この操作は公開版では利用できません。": "This action is unavailable in the public demo."}[data.error] ?? data.error) : data.error));
        else entry.resolve(data.value);
      };
    }
    const id = ++requestId;
    const timer = setTimeout(stop, 90000);
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, path, body });
  });
})();

// Public source metadata is shown separately from editable invoice fields.
window.showPublicSource = source => {
  let box = document.getElementById("public-source-info");
  if (!box) {
    box = document.createElement("aside");
    box.id = "public-source-info";
    box.style.cssText = "padding:1rem;border:1px solid #cbd5e1;margin:1rem 0;overflow-wrap:anywhere";
    document.getElementById("fields").before(box);
  }
  box.replaceChildren(); box.hidden = !source;
  if (!source) return;
  const en = document.documentElement.lang === "en";
  const heading = document.createElement("strong"); heading.textContent = source.title;
  const text = document.createElement("p");
  text.textContent = source.data_kind === "saved_model_output"
    ? (en ? "Saved Qwen model output with recorded corrections. Unverified fields remain under review; no approval is implied."
          : "保存済みのQwen出力と修正履歴です。未確認の項目は要確認のままで、承認済みではありません。")
    : (en ? "Public template sample · manually transcribed, not AI output. No PO is supplied. Transcription confirmation and CSV export are available; PO matching remains unavailable."
          : "公開元のテンプレートサンプルです。データは原本からの手作業による転記で、AI抽出結果ではありません。発注書はありません。転記確認とCSV出力は可能ですが、発注照合は未実施です。");
  box.append(heading, text);
  const notes = document.createElement("p"); notes.textContent = source.notes; box.append(notes);
  if(source.notice_file){const a=document.createElement("a");a.textContent="NOTICE";a.href="./"+source.notice_file;a.target="_blank";a.rel="noopener";box.append(a," · ");}
  for (const [label, href] of [[en?"Open original":"原本を開く", "./"+source.file], [en?"Source":"公開元",source.repository], [source.license+" license", "./"+source.license_file]]) {
    const a=document.createElement("a");a.textContent=label;a.href=href;a.target="_blank";a.rel="noopener";box.append(a, " · ");
  }
};
