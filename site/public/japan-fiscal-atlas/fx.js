async function showFx() {
  app.textContent = '外為特会の運用収入の予測を読み込んでいます。';
  let data;
  try {
    const response = await fetch('fx.json');
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    if (location.hash === '#fx') app.textContent = 'データを読み込めませんでした。ページを再読み込みしてください。';
    return;
  }
  if (location.hash !== '#fx') return;
  const names = ['当初予算額', '平均ずれ率補正', '米国金利回帰'];
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
  const pct = n => Number(n).toLocaleString('ja-JP', {maximumFractionDigits: 4});
  app.innerHTML = `<small>分野 07 ／ 外国為替資金</small><h1>外為特会の運用収入の年度予測</h1>
    <p>当初予算が成立した日に、その年度に外国為替資金特別会計が受け取る運用収入を予測します。対象は外国為替資金の運用による利子収入です。財務省の歳入決算に記載された「運用収入」と照合します。</p>
    <section class="panel"><h2>当初予算より何億円、決算に近づいたか</h2><p>改善額は「当初予算の絶対誤差 − 各方式の絶対誤差」です。棒がゼロより上なら当初予算より決算に近く、下なら当初予算より誤差が大きかった年度です。</p>
    <p><span style="color:#526b7c">■ 平均ずれ率補正</span>　<span style="color:#126961">■ 米国金利回帰</span>　単位：億円</p>
    <div class="jra-scroll"><div class="jra-plot"><svg viewBox="0 0 ${width} 266" role="img" aria-label="予算に対する年度別改善額。数値は年度別表に掲載。">${grid}${bars}</svg></div></div>
    <h3>${scored[0].year}〜${scored.at(-1).year}年度の成績（億円）</h3>${scoreTable}<p>検証した13年度では、当初予算をそのまま使う方式が、絶対誤差の中央値・平均ともに最小でした。前年の米国金利を使う回帰も、当初予算を安定して改善する結果には至りませんでした。</p></section>
    <section class="panel"><h2>実績公表前の予測（億円）</h2><p>2026年度の予測は、当初予算が成立した4月7日時点の情報で再現しました。この日までに決算を確認できた直近10年度は2015〜2024年度、金利の対象は2025年1〜12月です。</p>${yearTable(future)}</section>
    <section class="panel"><h2>3方式の入力と計算方法</h2>
    <ol><li><strong>当初予算額</strong>　外国為替資金特別会計「運用収入」の当初予算額を予測値にします。</li>
    <li><strong>平均ずれ率補正</strong>　「決算額 ÷ 当初予算額 − 1」を過去10年度で平均し、当年度の予算額に「1 ＋ 平均ずれ率」を掛けます。</li>
    <li><strong>米国金利回帰</strong>　前年1〜12月の米国10年国債利回り（FRBの定満期利回り）の平均を使います。外貨資産が生む利子を左右する金利環境の指標として選びました。</li></ol>
    <p>回帰式は「予算からのずれ率 ＝ 切片 ＋ 係数 × 前年の米国10年債利回り（％）」です。予算成立日までに決算を確認できた直近10年度で係数を求め、当年度の予算額に「1 ＋ 推定ずれ率」を掛けます。利回りは保有資産全体の実際の運用利率とは異なり、為替相場や資産構成の変化も円建ての収入に影響し得ます。</p></section>
    <section class="panel"><h2>年度別の予測と決算（億円）</h2>${yearTable(scored,true)}
    <p><a href="fx-results.csv" download>年度別予測（CSV）</a>　<a href="fx.json" download>全年度の入力・出典・回帰係数（JSON）</a></p>
    <details><summary>予測基準日と使用した10年度</summary>${table(['対象年度','予測基準日','使用した年度'],data.results.map(r=>[r.year,r.date,r.train.join('・')]))}</details></section>
    <section class="panel"><h2>2002年度からの資料確認表</h2><p>予算と決算は2002年度から収録しています。最初の検証は、2002〜2011年度の10件で予測できる2013年度です。金額は億円に丸めて表示しています。学習に使える年度は、各決算の国会提出日までに決算額が公表されていたものとして判定しました。金利の「当時の資料」は予算成立前の米国資料で年平均値を照合した年に表示します。原資料と入力値は各欄とJSONから確認できます。</p>
    ${table(['年度','予算成立日','当初予算（億円）','決算（億円）','決算の国会提出日','米国金利の対象暦年','平均利回り（％）'],data.history.map(r=>[r.year,link(r.dateSource,r.date),link(r.budgetUrl,amount(r.budget/100)),r.actual==null?'—':link(r.actualUrl,amount(r.actual/100)),r.available?link(r.dateUrl,r.available):'—',r.rateYear,link(r.rateUrl,pct(r.rate))+(r.rateSource.vintageVerified?' ／ '+link(r.rateSource.vintageUrl,'当時の資料'):'')]))}</section>`;
}
