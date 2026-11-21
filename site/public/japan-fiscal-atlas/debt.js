async function showDebt() {
  app.textContent = '公債利子等支払の予測を読み込んでいます。';
  let data;
  try {
    const response = await fetch('debt.json');
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    if (location.hash === '#debt') app.textContent = 'データを読み込めませんでした。ページを再読み込みしてください。';
    return;
  }
  if (location.hash !== '#debt') return;
  const names = ['当初予算額', '平均ずれ率補正', '金利差回帰'];
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
  app.innerHTML = `<small>分野 06 ／ 国債と借入と利払い</small><h1>公債利子等支払の年度予測</h1>
    <p>国の当初予算が成立した日に、国債整理基金特別会計からその年度に支払う公債の利子等を予測します。金額は歳出決算の「公債利子等支払」と比較します。元本の償還や、復興債など別項目で経理する支払いは含めません。過年度の原表では、対応する「利子及割引料」を確認しています。</p>
    <section class="panel"><h2>当初予算より何億円、決算に近づいたか</h2><p>改善額は「当初予算の絶対誤差 − 各方式の絶対誤差」です。棒がゼロより上の年度では、予測が決算に近づきました。</p>
    <p><span style="color:#526b7c">■ 平均ずれ率補正</span>　<span style="color:#126961">■ 金利差回帰</span>　単位：億円</p>
    <div class="jra-scroll"><div class="jra-plot"><svg viewBox="0 0 ${width} 266" role="img" aria-label="予算に対する年度別改善額。数値は年度別表に掲載。">${grid}${bars}</svg></div></div>
    <h3>${scored[0].year}〜${scored.at(-1).year}年度の成績（億円）</h3>${scoreTable}</section>
    <section class="panel"><h2>実績公表前の予測（億円）</h2><p>予算成立時点で利用できた情報から再計算しています。</p>${yearTable(future)}</section>
    <section class="panel"><h2>3方式の入力と計算方法</h2>
    <ol><li><strong>当初予算額</strong>　国債整理基金特別会計の当初予算額を予測値にします。</li>
    <li><strong>平均ずれ率補正</strong>　「決算額 ÷ 当初予算額 − 1」を過去10年度で平均し、当年度の予算額に「1 ＋ 平均ずれ率」を掛けます。</li>
    <li><strong>金利差回帰</strong>　予算成立日の前日までの直近の10年利付国債入札で、落札平均利回りから当初予算の10年債積算金利を引きます。たとえば市場が1.0％、積算金利が1.5％なら、金利差は −0.5ポイントです。過去10年度について「ずれ率 ＝ 切片 ＋ 係数 × 金利差」を最小二乗法で推定し、「当年度予算額 ×（1 ＋ 推定ずれ率）」を予測値にします。</li></ol>
    <p>金利差は予算の前提と市場の状況の隔たりを表します。既発の固定利付債では発行時の利率が続くため、支払額全体に市場金利を掛けると実態から離れます。<a href="https://report.jbaudit.go.jp/org/h19/2007-h19-1255-0.htm">会計検査院による国債利子の説明</a>。補正と回帰には予測基準日までに決算額を確認できる直近10年度を使います。</p></section>
    <section class="panel"><h2>年度別の予測と決算（億円）</h2>${yearTable(scored,true)}
    <p><a href="debt-results.csv" download>年度別予測（CSV）</a>　<a href="debt.json" download>全年度の入力・出典・回帰係数（JSON）</a></p>
    <details><summary>予測基準日と使用した10年度</summary>${table(['対象年度','予測基準日','使用した年度'],data.results.map(r=>[r.year,r.date,r.train.join('・')]))}</details></section>
    <section class="panel"><h2>2002年度からの資料確認表</h2><p>当初予算・決算の原表と、遅くとも決算額を確認できた日を年度別に示します。2004年度は当年度の予算積算金利を確認できず、回帰と比較用の平均ずれ率補正の学習から除きました。3方式を同じ条件で比べられるのは、10件の学習データがそろう2014年度からです。金利差の単位はパーセントポイントです。</p>
    ${table(['年度','予算成立日','当初予算（億円）','決算（億円）','決算を確認できた時点','積算金利','落札平均利回り','入札日','金利差'],data.history.map(r=>[r.year,link(r.dateSource,r.date),link(r.budgetUrl,amount(r.budget/100)),r.actual==null?'—':link(r.actualUrl,amount(r.actual/100))+(r.altActualUrl?' ／ '+link(r.altActualUrl,'参考'):''),r.available?link(r.dateUrl,r.available):'実績公表前',(r.assumed.rate==null?'未確認':link(r.assumed.url,pct(r.assumed.rate)+'％'))+(r.assumed.confirmation?' ／ '+link(r.assumed.confirmation,'裏付け'):''),link(r.market.releaseUrl || r.market.url,pct(r.market.rate)+'％'),r.market.date,r.assumed.rate==null?'—':pct(r.market.rate-r.assumed.rate)]))}</section>`;
}
