function improvementPanel(scored, models) {
  const colors = ['#54779d', '#007467', '#ab551d'];
  const rows = scored.map(row => {
    const baseline = Math.abs(row.budget - row.actual);
    const gains = models.map(([key]) => (baseline - Math.abs(row[key] - row.actual)) / 10000);
    return {year: row.year, gains};
  });
  const signed = n => (n > 0 ? '+' : '') + n.toFixed(2);
  const limit = Math.max(1, Math.ceil(Math.max(...rows.flatMap(r => r.gains.map(Math.abs)))));
  const spacing = 59, left = 49, width = left + spacing * rows.length + 12;
  const zero = 139, scale = 108 / limit;
  const grid = Array.from({length: 2 * limit + 1}, (_, i) => {
    const tick = limit - i, y = zero - tick * scale;
    return `<line x1="${left}" x2="${width - 12}" y1="${y}" y2="${y}" stroke="${tick ? '#dbe4e3' : '#263f49'}" stroke-width="${tick ? 1 : 2}"/><text x="${left - 9}" y="${y+5}" text-anchor="end">${tick > 0 ? '+' : ''}${tick}</text>`;
  }).join('');
  const bars = rows.map(({year, gains}, i) => {
    const center = left + (i + 0.5) * spacing;
    return gains.map((v,j) => `<rect x="${center + (j - (models.length-1)/2)*15 - 6.5}" y="${zero - Math.max(v,0)*scale}" width="13" height="${Math.abs(v)*scale}" fill="${colors[j]}"><title>${year}年度・${models[j][1]}　${signed(v)}兆円</title></rect>`).join('') +
      `<text x="${center}" y="272" text-anchor="middle">${year}</text>`;
  }).join('');
  return `<section class="panel"><h2>当初予算より、どれだけ決算に近づいたか</h2>
    <p>${rows[0].year}〜${rows.at(-1).year}年度の改善額。ゼロは、予測の絶対誤差が当初予算の絶対誤差と等しいことを示します。棒が上に伸びるほど政府見積もりより決算に近く、下に伸びるほど誤差が大きくなります。</p>
    <div class="legend">${models.map(([,label],i) => `<span><b style="color:${colors[i]}">■</b> ${label}</span>`).join('')}</div>
    <div class="fiscal-scroll" tabindex="0" role="region" aria-label="年度別改善額グラフ。狭い画面では横にスクロールできます"><svg role="img" aria-label="年度別の改善額。数値は直後の表に掲載" viewBox="0 0 ${width} 298" style="width:100%;min-width:${width}px;height:auto;display:block;font:14px system-ui;fill:#263f49"><text x="4" y="18">兆円</text>${grid}${bars}<text x="${width-12}" y="295" text-anchor="end">年度</text></svg></div>
    <p>改善額 ＝ 当初予算の絶対誤差 − モデルの絶対誤差。全方式を比較できる${rows.length}年度を表示しています。</p>
    <details><summary>年度ごとの改善額を数値で見る</summary><div class="fiscal-scroll"><table class="fiscal-table"><thead><tr><th>年度</th>${models.map(([,t]) => `<th>${t}（兆円）</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${r.year}</th>${r.gains.map(v => `<td>${signed(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details></section>`;
}

function showCorporate(year = budgetDay.at(-1).year) {
  const row = budgetDay.find(r => r.year === year);
  const quarterEnd = row.profitPeriod ? Number(row.profitPeriod.slice(5,7)) : null;
  const amount = n => n == null ? '—' : (n / 10000).toFixed(2);
  const decimal = n => n.toLocaleString('ja-JP', {maximumFractionDigits: 4});
  const factor = rate => rate < 0 ? `1 − ${decimal(-rate)}%` : `1 ＋ ${decimal(rate)}%`;
  const calculation = (base, rate, forecast) =>
    `${decimal(base / 10000)}兆円 ×（${factor(rate)}）≈ ${amount(forecast)}兆円`;
  const scored = budgetDay.filter(r => r.actual != null && r.meanForecast != null && r.regression != null && r.gdpForecast != null);
  const methods = [['budget','政府見積もり（当初予算）'],['meanForecast','平均ずれ率で補正'],['regression','企業利益を使う回帰'],['gdpForecast','名目GDP連動']];
  const scores = methods.map(([key, title]) => {
    const errors = scored.map(r => Math.abs(r[key] - r.actual));
    const gains = scored.map((r, i) => Math.abs(r.budget - r.actual) - errors[i]).sort((a, b) => a - b);
    const middle = Math.floor(gains.length / 2);
    const median = (gains[middle] + gains[Math.floor((gains.length - 1) / 2)]) / 2;
    return {key, title, mae: errors.reduce((a, b) => a + b, 0) / errors.length,
            wins: gains.filter(gain => gain > 0).length, median};
  });
  const datesUrl = year === 2026 ? 'https://www.sangiin.go.jp/japanese/ugoki/r8/260407.html' : year === 2025 ? 'https://www.mof.go.jp/public_relations/conference/my20250331.html' : 'https://national-diet.com/wp-content/uploads/2024/04/yosanzoho.pdf';
  app.innerHTML = `<small>分野 01 ／ 税収と還付</small><h1>法人税収の年度予測</h1>
  <p>当初予算の成立日を基準に、一般会計の法人税収の決算額を4方式で予測します。政府見積もり、過去の平均ずれ率による補正、企業利益を使う回帰、名目GDP連動の結果を比較します。</p>
  ${improvementPanel(scored, methods.slice(1))}
  <section class="panel"><h2>${scored[0].year}〜${scored.at(-1).year}年度の成績</h2>
  <p>平均絶対誤差は、予測が決算から平均で何兆円離れたかを示します。年度別改善額の中央値は、当初予算と各方式の絶対誤差の差を年度ごとに求め、その中央値を取ったものです。</p>
  <div class="fiscal-scroll"><table class="fiscal-table"><thead><tr><th>方式</th><th>平均絶対誤差（兆円）</th><th>改善した年度数</th><th>年度別改善額の中央値（兆円）</th></tr></thead><tbody>${scores.map(m => `<tr><th scope="row">${m.title}</th><td>${(m.mae/10000).toFixed(3)}</td><td>${m.key === 'budget' ? '基準' : m.wins+'／'+scored.length}</td><td>${m.key === 'budget' ? '基準' : (m.median > 0 ? '+' : '')+(m.median/10000).toFixed(3)}</td></tr>`).join('')}</tbody></table></div><p><strong>検証結果の読み方</strong>　平均ずれ率補正と企業利益回帰の学習期間は、上の表と同じ検証年度で複数の候補を比較し、10年度に決めました。表の成績には、この選択の影響が含まれます。</p></section>
  <section class="panel"><div class="row"><h2>${year}年度の予測と入力</h2><label>対象年度 <select id="fy">${budgetDay.map(r => `<option value="${r.year}" ${year===r.year?'selected':''}>${r.year}年度</option>`).join('')}</select></label></div>
  <p>予測基準日　<a href="${datesUrl}">${row.date}（当初予算成立日）</a>　／　${row.actual == null ? '決算待ち（予測額は成立日時点の情報で再計算）' : '決算実績 '+amount(row.actual)+'兆円'}</p>
  <div class="stats corporate-stats">${methods.map(([key,title])=>`<div><small>${title}</small><strong>${amount(row[key])} <small>兆円</small></strong></div>`).join('')}</div>
  <p>当初予算額　<a href="${row.budgetUrl}">${row.budget.toLocaleString('ja-JP')}億円</a></p>
  <p>${row.growthUrl ? `${year}年度の回帰には、${row.profitPeriod.slice(0,4)}年${quarterEnd-2}〜${quarterEnd}月期の<a href="${row.growthUrl}">経常利益の前年同期比 ${row.growth}%</a>を使います（金融業・保険業を除く全産業、${row.profitKnownBy}時点で公表済み）。` : 'この年度は成立日時点の企業利益が未収録です。'}</p>
  <p>${row.gdpForecast == null ? "名目GDP連動の入力は2014年度予測分から収録しています。" : `名目GDP連動は、${year-1}年度の<a href="${row.revisedUrl}">法人税収の補正後予算額 ${row.priorRevised.toLocaleString("ja-JP")}億円</a>に、${year}年度の<a href="${row.outlookUrl}">名目GDP成長率見通し ${row.nominalGrowth}%</a>を適用した予測です。`}</p>
  <p>平均補正と回帰が参照する10年度は${year-11}〜${year-2}年度。利用できる年度数は平均補正が${row.meanTraining}件、回帰が${row.training}件です。この2方式は10年度分がそろった時点から予測します。表の「—」は、予測に必要な入力が不足しているか、決算がまだ出ていないことを示します。</p>
  <details><summary>年度別の予測と決算（兆円）</summary><div class="fiscal-scroll"><table class="fiscal-table"><thead><tr><th>基準日</th>${methods.map(([,t])=>`<th>${t}</th>`).join('')}<th>決算</th></tr></thead><tbody>${budgetDay.map(r=>`<tr><th>${r.date}</th>${methods.map(([k])=>`<td>${amount(r[k])}</td>`).join('')}<td>${amount(r.actual)}</td></tr>`).join('')}</tbody></table></div></details></section>
  <section class="panel"><h2>4方式の計算式と考え方</h2><p>計算例は選択中の${year}年度です。式の数値は表示用に丸めています。</p>
  <h3>政府見積もり（当初予算）</h3><p>財務省が予算編成時の経済見通しと課税実績などから見積もった法人税収です。この金額をそのまま予測額として決算と比較します。</p><p class="corp-equation">予測額 ＝ 当年度の当初予算額 ＝ ${decimal(row.budget / 10000)}兆円</p>
  <details><summary>政府は法人税収をどう見積もるか（2026年度の例）</summary>
  <p>財務省は、前年度に企業が負担する年税額の見込みを出発点に、生産・物価・輸出・消費の見通しや繰越欠損金の影響を織り込み、2026年度の年税額が前年度比で約5％増えると見込みました。</p>
  <p>企業の事業年度と国に税金が入る年度にはずれがあります。そこで中間申告や年度内に納付される割合を考慮し、更正決定分と過年度の滞納分からの収入を加えます。こうして見積もった22兆1,820億円から還付見込み1兆5,480億円を引き、税制改正による増収見込み620億円を加えた<strong>20兆6,960億円</strong>が、2026年度の当初予算額です。<a href="https://www.mof.go.jp/tax_policy/reference/budget_explanation/008aR8a.pdf">財務省『令和8年度 租税及び印紙収入予算の説明』本文8〜9頁</a></p></details>
  <h3>平均ずれ率で補正</h3><p>政府の見積もりに上振れや下振れが繰り返されるなら、その傾向を今年の予測に生かせます。税収規模の異なる年度を比べるため、ずれは当初予算に対する割合で測ります。例えば予算10兆円に対して決算が11兆円なら＋10％、9兆円なら−10％です。直近10年度の符号付きの率を平均し、その分だけ当年度の当初予算を増減します。</p>
  <div class="corp-equation">各年度のずれ率 ＝（決算額 − 当初予算額）÷ 当初予算額<br>予測額 ＝ 当年度の当初予算額 ×（1 ＋ 10年度分のずれ率の平均）</div>
  ${row.meanForecast == null ? '<p>この年度は10年度分の決算がそろっていません。</p>' : `<p>${year}年度の計算　${calculation(row.budget, row.meanBias*100, row.meanForecast)}</p>`}
  <h3>企業利益を使う回帰</h3><p>法人税は企業の所得にかかるため、企業利益の伸びは税収を見通す手掛かりになります。ここでは経常利益を課税所得の動きを捉える目安とし、予算成立日までに公表された最新四半期の経常利益の伸び率と、決算の当初予算からのずれ率との関係を、過去10年度の単回帰で推定します。政府見積もりにも企業の業績見通しは織り込まれるため、利益の情報を加える効果は年度別グラフで確かめます。</p>
  <div class="corp-equation">予測ずれ率（%）＝ 切片 ＋ 傾き × 企業利益の伸び率（%）<br>予測額 ＝ 当年度の当初予算額 ×（1 ＋ 予測ずれ率（％）÷ 100）</div>
  <p>切片は利益の伸びが0%のときに見込むずれ率です。傾きは、利益の伸びが1ポイント高くなると予測ずれ率が何ポイント変わるかを表します。どちらも過去10年度のデータから求めます。</p>
  ${row.regression == null ? '<p>この年度は回帰の予測に必要な入力がそろっていません。</p>' : `<p>${year}年度の予測ずれ率は、${decimal(row.intercept*100)} ${row.slope < 0 ? '−' : '＋'} ${decimal(Math.abs(row.slope)*100)} ×（${decimal(row.growth)}）≈ ${decimal((row.regression/row.budget-1)*100)}%。これを当初予算額に適用すると、${calculation(row.budget,(row.regression/row.budget-1)*100,row.regression)}です。</p>`}
  <h3>名目GDP連動</h3>
  <div class="corp-equation">予測額 ＝ 前年度の補正後予算額 ×（1 ＋ 当年度の名目GDP成長率見通し）</div>
  ${row.gdpForecast == null ? '<p>この年度のGDP連動の入力は未収録です。</p>' : `<p>${year}年度の計算　${calculation(row.priorRevised,row.nominalGrowth,row.gdpForecast)}</p>`}
  <p>IMFの法人税収予測ガイドは、GDPが1％伸びれば法人税収も1％伸びるという仮定を、モデルの精度を測る比較基準に使っています。このサイトでは、前年度の法人税収の補正後予算額と、当年度の名目GDP成長率の政府見通しを組み合わせました。<a href="https://www.imf.org/en/publications/imf-how-to-notes/issues/2025/11/24/how-to-forecast-corporate-income-tax-revenues-571920">IMFの実務ガイド（2025年、英語）</a></p>
  </section>
  <section class="panel"><h2>検証条件と出典</h2><p>政府案の概算が示された後、国会で当初予算が成立するまでに新たな統計が公表されることがあります。企業利益回帰では、各年度の成立日を情報の締切として予測を再構成し、後に判明した一般会計の法人税収決算額と照合しています。平均補正と回帰では、成立時点で決算が判明している直近10年度を使います。</p>
  <p>GDP連動は税収が名目GDPと同率で伸びると仮定し、係数は1に固定しています。前年度補正後予算額の一部は後年の予算・決算対照表で照合しました。</p>
  <p>決算の金額は後年集計の億円単位の系列で再構成しました。過去に資料が差し替えられたかどうかは、全年度については確認できていません。表示する日付は入力を区切る基準日で、予測を当サイトに掲載した日とは異なります。</p>
  <p><a href="https://www.mof.go.jp/tax_policy/summary/condition/zeisyu.xls">財務省の税収系列</a>　<a href="https://houchi-unyo.com/data/tax-revenue/">参照した決算額の年度表（CC BY 4.0、抜粋・加工）</a></p></section>`;
  document.querySelector('#fy').onchange = e => {showCorporate(Number(e.target.value));document.querySelector('#fy').focus()};
}
