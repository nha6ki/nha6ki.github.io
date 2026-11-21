async function showPatent() {
  app.textContent = '特許料等収入の予測を読み込んでいます。';
  let data;
  try {
    const response = await fetch('patent.json');
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    if (location.hash === '#patent') app.textContent = 'データを読み込めませんでした。ページを再読み込みしてください。';
    return;
  }
  if (location.hash !== '#patent') return;
  const names = ['当初予算額', '平均ずれ率補正', '出願件数回帰'];
  const amount = n => n == null ? '—' : Math.round(n).toLocaleString('ja-JP');
  const link = (url, label) => url ? `<a href="${url}">${label}</a>` : label;
  const table = (headers, rows) => `<div class="fiscal-scroll"><table class="fiscal-table"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([h,...cells])=>`<tr><th scope="row">${h}</th>${cells.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const scored = data.results.filter(r => r.errors.length);
  const future = data.results.filter(r => !r.errors.length);
  const bounds = Math.max(1, ...scored.flatMap(r => r.gains.map(Math.abs)));
  const step = 10 ** Math.floor(Math.log10(bounds));
  const limit = Math.ceil(bounds/step)*step;
  const width = Math.max(720, scored.length*66 + 110);
  const y = gain => 130 - 99 * gain / limit;
  const grid = [-limit,0,limit].map(v=>`<line x1="77" x2="${width-10}" y1="${y(v)}" y2="${y(v)}" stroke="${v?'#d7dfe2':'#263f49'}"/><text x="72" y="${y(v)+5}" text-anchor="end">${amount(v)}</text>`).join('');
  const bars = scored.map((r,i)=>{
    const x = 78 + (i+.5)*(width-90)/scored.length;
    return [1,2].map(j=>`<rect x="${x+(j===1?-14:1)}" y="${Math.min(130,y(r.gains[j]))}" width="13" height="${Math.abs(y(r.gains[j])-130)}" fill="${j===1?'#647f92':'#126961'}"><title>${r.year}年度・${names[j]}：${amount(r.gains[j])}億円</title></rect>`).join('')+`<text x="${x}" y="253" text-anchor="middle">${r.year}</text>`;
  }).join('');
  const scoreTable = table(['方式','絶対誤差の中央値','絶対誤差の平均','当初予算より改善'],data.summary.map((r,i)=>[names[i],amount(r.median),amount(r.mean),i?r.wins+'／'+scored.length:'基準']));
  const yearTable = (rows, scoredTable=false) => {
    const headers = ['年度', ...names, '決算額'];
    if (scoredTable) headers.push('補正の改善額', '回帰の改善額');
    return table(headers, rows.map(r => [r.year, ...r.forecasts.map(amount), amount(r.actual),
      ...(scoredTable ? r.gains.slice(1).map(amount) : [])]));
  };
  app.innerHTML = `<small>分野 08 ／ その他の資金と調整</small><h1>特許料等収入の年度予測</h1>
    <p>当初予算が成立した日に、特許特別会計がその年度に受け取る特許料・手数料等の合計額を予測します。予測額は、歳入決算の款「特許料等収入」に記載された収納済歳入額と照合します。特許印紙による予納は2023年3月末で終了しました。印紙と現金等の納付分を合わせ、制度変更の前後で同じ範囲を比較します。<a href="https://www.jpo.go.jp/system/process/tesuryo/yonou_oshirase.html">特許庁の予納に関するお知らせ</a>。<a href="https://www.jpo.go.jp/system/laws/sesaku/yosan/kaiji/tokukai_zyouhoukaizi.html">特許庁の予算・決算資料</a>。</p>
    <section class="panel"><h2>当初予算より何億円、決算に近づいたか</h2><p>改善額は「当初予算の絶対誤差 − 各方式の絶対誤差」です。ゼロより上なら当初予算より決算に近く、下なら当初予算より誤差が大きかった年度です。</p>
    <p><span style="color:#526b7c">■ 平均ずれ率補正</span>　<span style="color:#126961">■ 出願件数回帰</span>　単位：億円</p>
    <div class="jra-scroll"><div class="jra-plot"><svg viewBox="0 0 ${width} 266" role="img" aria-label="予算に対する年度別改善額。数値は年度別表に掲載。">${grid}${bars}</svg></div></div>
    <h3>${scored[0].year}〜${scored.at(-1).year}年度の成績（億円）</h3>${scoreTable}<p>${names[data.summary.findIndex(m=>m.median===Math.min(...data.summary.map(v=>v.median)))]}が絶対誤差の中央値で最小、${names[data.summary.findIndex(m=>m.mean===Math.min(...data.summary.map(v=>v.mean)))]}が平均で最小でした。2021年度は出願件数回帰の誤差が約228億円に達し、当初予算の約176億円を上回りました。</p></section>
    <section class="panel"><h2>実績公表前の予測（億円）</h2><p>2026年度の予測は、当初予算が成立した4月7日時点の情報で再現しました。この日までに決算を確認できた直近10年度は2015〜2024年度、出願件数の対象は2024年1〜12月です。</p>${yearTable(future)}</section>
    <section class="panel"><h2>3方式の入力と計算方法</h2>
    <ol><li><strong>当初予算額</strong>　特許特別会計の款「特許料等収入」の当初予算額を予測値にします。</li>
    <li><strong>平均ずれ率補正</strong>　「決算額 ÷ 当初予算額 − 1」を過去10年度で平均し、当年度の予算額に「1 ＋ 平均ずれ率」を掛けます。</li>
    <li><strong>出願件数回帰</strong>　予算成立日前に確定件数を確認できるよう、全年度で2暦年前の特許出願件数（日本の特許庁への出願、出願人の国籍を問わず集計）を使います。</li></ol>
    <p>出願はその後の審査請求や登録などの料金につながるため、手続の規模を表す指標として選びました。「予算からのずれ率 ＝ 切片 ＋ 係数 × 出願件数（10万件単位）」を直近10年度で推定し、当年度の予算に「1 ＋ 推定ずれ率」を掛けます。特許登録後に納める特許料（年金）、料金改定、意匠・商標などの収入もあるため、出願件数だけで料金収入のすべてを説明できるわけではありません。</p></section>
    <section class="panel"><h2>年度別の予測と決算（億円）</h2>${yearTable(scored,true)}
    <p><a href="patent-results.csv" download>年度別予測（CSV）</a>　<a href="patent.json" download>全年度の入力・出典・回帰係数（JSON）</a></p>
    <details><summary>予測基準日と使用した10年度</summary>${table(['対象年度','予測基準日','使用した年度'],data.results.map(r=>[r.year,r.date,r.train.join('・')]))}</details></section>
    <section class="panel"><h2>2002年度からの資料確認表</h2><p>予算と決算は2002年度から収録しています。最初の検証は、2002〜2011年度の10件で予測できる2013年度です。金額は億円に丸めて表示しています。学習に使える年度は、各決算の国会提出日までに決算額が公表されていたものとして判定しました。出願件数は2暦年前の値です。件数の出典と当時の刊行時期の根拠を別々に示します。古い年報の刊行時期は国立国会図書館の書誌も用いて確認しています。月・年まで判明した場合はそれぞれ月末・年末を利用可能日の上限としました。</p>
    ${table(['年度','予算成立日','当初予算（億円）','決算（億円）','決算の国会提出日','出願件数の対象年','特許出願件数','公表時期'],data.history.map(r=>[r.year,link(r.dateSource,r.date),link(r.budgetUrl,amount(r.budget/100)),r.actual==null?'—':link(r.actualUrl,amount(r.actual/100)),r.available?link(r.dateUrl,r.available):'—',r.calendarYear,link(r.countUrl,amount(r.applications)),link(r.publicationUrl,r.publicationLabel)]))}</section>`;
}
