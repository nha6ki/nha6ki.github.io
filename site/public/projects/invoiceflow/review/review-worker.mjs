const RUNTIME = "https://cdn.jsdelivr.net/pyodide/v314.0.8/full/";
const files = ["review_flow.py", "three_way.py", "review_ui.py", "fixtures.json", "review_bridge.py"];

const engine = (async () => {
  const reads = Promise.all(files.map(async file => {
    const response = await fetch(new URL(file, import.meta.url));
    if (!response.ok) throw Error("Missing review asset");
    return [file, await response.text()];
  }));
  const library = import(RUNTIME + "pyodide.mjs").then(({ loadPyodide }) =>
    loadPyodide({ indexURL: RUNTIME }));
  const [sources, py] = await Promise.all([reads, library]);
  for (const [name, source] of sources) py.FS.writeFile(name, source);
  py.runPython(sources.find(([name]) => name === "review_bridge.py")[1]);
  return py.globals.get("request");
})();
engine.catch(() => self.postMessage({ fatal: true }));

self.onmessage = async ({ data: { id, path, body } }) => {
  try {
    const request = await engine;
    const result = JSON.parse(request(path, JSON.stringify(body ?? null)));
    self.postMessage({ id, ...result });
  } catch {
    self.postMessage({ id, error: "照合を完了できませんでした。ページを再読み込みしてやり直してください。" });
  }
};
