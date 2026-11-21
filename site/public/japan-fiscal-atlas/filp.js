async function showFilp() {
  app.textContent = '財政融資の予測を読み込んでいます。';
  let data;
  try {
    const response = await fetch('filp.json');
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    if (location.hash === '#filp') app.textContent = 'データを読み込めませんでした。ページを再読み込みしてください。';
    return;
  }
  if (location.hash !== '#filp') return;
  const names = ['当初計画額', '平均ずれ率補正', '計画額の前年比回帰'];
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
  const scoreTable = table(['方式','絶対誤差の中央値','絶対誤差の平均','当初計画より改善'],data.summary.map((r,i)=>[names[i],amount(r.median),amount(r.mean),i?r.wins+'／'+scored.length:'基準']));
  const yearTable = (rows, scoredTable=false) => {
    const headers = ['年度', ...names, '決算時点の見込値'];
    if (scoredTable) headers.push('補正の改善額', '回帰の改善額');
    return table(headers, rows.map(r => [r.year, ...r.forecasts.map(amount), amount(r.actual),
      ...(scoredTable ? r.gains.slice(1).map(amount) : [])]));
  };
  app.innerHTML = `<small>分野 05 ／ 財政投融資</small><h1>財政融資額の年度予測</h1>
  <p>当初予算の成立日に、その年度の計画に対応する財政融資額を予測します。対象は全機関の合計で、予測の検証には、財務省が資金年度ベースで集計した決算時点の見込額を使います。産業投資と政府保証は対象外です。</p>
  <section class="panel"><h2>当初計画より何億円、実績に近づいたか</h2><p>ゼロより上の棒は予測誤差が縮まった年度、下の棒は広がった年度です。2方式とも同じ年度で当初計画と比較しています。改善額 ＝ 当初計画の絶対誤差 − 各方式の絶対誤差です。</p>
  <p><span style="color:#526b7c">■ 平均ずれ率補正</span>　<span style="color:#126961">■ 計画額の前年比回帰</span>　単位：億円</p>
  <div class="jra-scroll"><div class="jra-plot"><svg viewBox="0 0 ${width} 266" role="img" aria-label="年度別の絶対誤差の改善額。下の年度別表で各方式の金額を確認できます。">${grid}${bars}</svg></div></div>
  <p>2021年度は当初計画が前年の約3.4倍に増え、回帰の予測額は2兆3,044億円まで下がりました。実績は14兆922億円で、回帰も大きく過小予測しています。当初計画からの誤差の縮小幅が大きく、この1年度が回帰の平均改善額を押し上げています。</p><h3>${scored.length}年度の成績（億円）</h3>${scoreTable}<p>絶対誤差の中央値が最も小さいのは平均ずれ率補正です。前年比回帰は絶対誤差の平均が最も小さい一方、当初計画より実績に近づいたのは13年度中6年度でした。</p></section>
  ${future.length?`<section class="panel"><h2>実績公表前の予測（億円）</h2><p>各年度の予算成立時点で利用できた情報を使って再計算した値です。</p>${yearTable(future)}</section>`:''}
  <section class="panel"><h2>3方式の入力と計算方法</h2><ol><li><strong>当初計画額</strong>　計画をそのまま予測額にします。</li>
  <li><strong>平均ずれ率補正</strong>　各年度のずれ率を「実績 ÷ 当初計画 − 1」で求め、当年度の計画に「1 ＋ 過去の平均ずれ率」を掛けます。</li>
  <li><strong>計画額の前年比回帰</strong>　計画を大きく増減した年ほどずれ方も変わるかを調べます。過去の「計画額の前年比」から「ずれ率」を最小二乗法で推定し、当年度の計画に「1 ＋ 推定ずれ率」を掛けます。</li></ol>
  <p>補正と回帰には、予測基準日までに実績の掲載を確認でき、前年の計画額もそろう直近10年度を使います。年度ごとに係数を計算し直します。</p></section>
  <section class="panel"><h2>年度別の予測と実績（億円）</h2>${yearTable(scored,true)}<p><a href="filp-results.csv" download>年度別の予測と学習年度をCSVで取得</a>　<a href="filp.json" download>年度別の入力・実績・出典（JSON）</a></p>
  <details><summary>予測基準日と使用した10年度</summary>${table(['対象年度','予測基準日','使用した年度'],data.results.map(r=>[r.year,r.date,r.train.join('・')]))}</details></section>
  <section class="panel"><h2>2002年度からの資料確認表</h2><p>「公表を確認できた時点」は、その金額を掲載した資料を遅くともその時点で参照できたことを示します。刊行月だけが分かる資料は月末を使います。2002年度は翌年版リポートの「財政投融資計画・残高の推移」と「財政投融資原資の状況」で一致する実績17兆3,070億円を採用しました。後年の2011年版では17兆2,642億円に改訂されています。2003年度以降は決算時の見込値を採用しました。古い資料は保存日も公表時期の裏付けに使っています。<a href="https://www.mof.go.jp/pri/publication/policy_history/series/h1-12/1_1_3.pdf">2001年度の当初計画28兆7,448億円</a>は、2002年度の前年比を求めるためだけに使用しました。</p>
  ${table(['年度','予算成立日','当初計画（億円）','実績（億円）','実績の版','公表を確認できた時点・根拠'],data.history.map(r=>[r.year,link(r.dateSource,r.date),link(r.planSource,amount(r.plan)),link(r.source,amount(r.actual)),r.vintage,r.available?link(r.dateEvidence || r.source,r.available):r.year===2026?'実績公表前':'未確認']))}
  <p>古い年度の「財政融資」には郵便貯金資金・簡易生命保険資金が含まれる場合があります。計画・実績とも財政融資全体を採っています。資料の所在は<a href="https://www.mof.go.jp/pri/publication/zaikin_geppo/hyou06.htm">財政金融統計月報の年次索引</a>から確認できます。</p></section>`;
}
