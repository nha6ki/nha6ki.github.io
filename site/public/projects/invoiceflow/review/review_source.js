// Show one concise origin label; retain source notices in expandable details.
window.showPublicSource = (source, reviewId) => {
  const demo = document.body.dataset.reviewMode !== "local";
  let box = document.getElementById("public-source-info");
  if (!box) {
    box = document.createElement("aside");
    box.id = "public-source-info";
    box.style.cssText = "margin:0.75rem 0;overflow-wrap:anywhere";
    document.getElementById("title").after(box);
  }
  box.replaceChildren(); box.hidden = false;
  const en = document.documentElement.lang === "en";
  const label = document.createElement("strong");
  label.textContent = source?.data_kind === "saved_model_output"
    ? (en ? "Input values: extracted by Qwen" : "入力値の作成方法：Qwenで抽出")
    : source?.data_kind === "model_output"
      ? (en ? "Input values: AI extraction" : "入力値の作成方法：AIで抽出")
    : source?.data_kind === "saved_data"
      ? (en ? "Input values: saved data" : "入力値の作成方法：保存済みデータ")
    : source
      ? (en ? "Input values: manually transcribed" : "入力値の作成方法：手作業で転記")
      : (en ? "Input values: prepared for the demo" : "入力値の作成方法：デモ用に作成");
  box.append(label);
  document.getElementById("public-source-details")?.remove();
  if (demo && !source && Number(reviewId) === 7) {
    const details = document.createElement("details");
    details.id = "public-source-details";
    const summary = document.createElement("summary");
    summary.textContent = en ? "Source details" : "出典・詳細";
    const note = document.createElement("p");
    note.textContent = en ? "UC12 was reconstructed from reported Qwen output; it is not the original model output file." : "UC12は報告されたQwen出力から再構成したサンプルです。モデルの出力ファイルそのものではありません。";
    const link = document.createElement("a");
    link.href = "./sample-7-source.json";
    link.textContent = en ? "Source and sample provenance" : "出典とサンプル作成情報";
    details.append(summary, note, link);
    document.querySelector(".pdf-panel").append(details);
  }
  if (!source) return;
  const details = document.createElement("details");
  details.id = "public-source-details";
  details.style.cssText = "margin-top:0.75rem;overflow-wrap:anywhere";
  const summary = document.createElement("summary");
  summary.textContent = en ? "Source details" : "出典・詳細";
  details.append(summary);
  const title = document.createElement("p"); title.textContent = source.title;
  const notes = document.createElement("p"); notes.textContent = source.notes;
  details.append(title, notes);
  const links = [];
  if(source.original_url || source.file) links.push([en?"Open original":"原本を開く", source.original_url || "./"+source.file]);
  if(source.repository) links.push([en?"Source":"公開元",source.repository]);
  if(source.license_file) links.push([source.license+" license", "./"+source.license_file]);
  if(source.notice_file) links.push(["NOTICE", "./"+source.notice_file]);
  for (const [label, href] of links) {
    const a=document.createElement("a");a.textContent=label;a.href=href;
    a.target="_blank";a.rel="noopener";details.append(a, " · ");
  }
  document.querySelector(".pdf-panel").append(details);
};
