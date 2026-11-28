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

// Show one concise origin label; retain source notices in expandable details.
window.showPublicSource = source => {
  let box = document.getElementById("public-source-info");
  if (!box) {
    box = document.createElement("aside");
    box.id = "public-source-info";
    box.style.cssText = "margin:0.75rem 0;overflow-wrap:anywhere";
    document.getElementById("fields").before(box);
  }
  box.replaceChildren(); box.hidden = false;
  const en = document.documentElement.lang === "en";
  const label = document.createElement("strong");
  label.textContent = source?.data_kind === "saved_model_output"
    ? (en ? "Origin: Qwen extraction" : "元データ：Qwen抽出")
    : source
      ? (en ? "Origin: manual transcription" : "元データ：手作業で転記")
      : (en ? "Origin: prepared demo data" : "元データ：デモ用データ");
  box.append(label);
  if (!source) return;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = en ? "Source details" : "出典・詳細";
  details.append(summary);
  const title = document.createElement("p"); title.textContent = source.title;
  const notes = document.createElement("p"); notes.textContent = source.notes;
  details.append(title, notes);
  const links = [[en?"Open original":"原本を開く", "./"+source.file],
    [en?"Source":"公開元",source.repository],
    [source.license+" license", "./"+source.license_file]];
  if(source.notice_file) links.push(["NOTICE", "./"+source.notice_file]);
  for (const [label, href] of links) {
    const a=document.createElement("a");a.textContent=label;a.href=href;
    a.target="_blank";a.rel="noopener";details.append(a, " · ");
  }
  box.append(details);
};
