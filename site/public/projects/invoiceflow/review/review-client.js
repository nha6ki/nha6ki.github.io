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

