/* Transport for the original Invoice Review page. Requests stay in this tab. */
(() => {
  let worker;
  let unusable = false;
  let requestId = 0;
  const pending = new Map();
  const loadError = "照合エンジンを読み込めませんでした。ネット接続を確認してページを再読み込みしてください。";

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
        worker = new Worker(new URL("./review-worker.mjs", document.baseURI), { type: "module" });
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
        if (data.error !== undefined) entry.reject(Error(data.error));
        else entry.resolve(data.value);
      };
    }
    const id = ++requestId;
    const timer = setTimeout(stop, 90000);
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, path, body });
  });
})();
