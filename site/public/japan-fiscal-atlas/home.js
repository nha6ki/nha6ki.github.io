const homeStudies = [
  ['#corporate', '税収と還付', '法人税収', '2014〜2025', '当初予算', 7, '企業利益', 8, 12],
  ['#jra', '税外収入', 'JRA納付金', '2013〜2024', '当初予算', 7, '馬券の売得金', 7, 12],
  ['#pension', '年金と保険と子育て', '厚生年金保険料収入', '2013〜2025', '当初予算', 9, '予算額の前年比', 9, 13],
  ['#allocation', '政策支出と地方移転', '地方交付税', '2013〜2025', '当初計画', 7, '計画額の前年比', 7, 13],
  ['#filp', '財政投融資', '財政融資額', '2013〜2025', '当初計画', 8, '計画額の前年比', 6, 13],
  ['#debt', '国債と借入と利払い', '公債利子等支払', '2014〜2025', '当初予算', 12, '10年国債の金利差', 12, 12],
  ['#fx', '外国為替資金', '外為特会の運用収入', '2013〜2025', '当初予算', 2, '米国10年国債の利回り', 2, 13],
  ['#patent', 'その他の資金と調整', '特許料等収入', '2013〜2025', '当初予算', 2, '特許出願件数', 6, 13]
];

function showHome() {
  const bar = (wins, total, method) => `<div class="wins-bar ${method}">
    <span class="wins-track"><span style="width:${100 * wins / total}%"></span></span>
    <span class="wins-value">${wins}／${total}</span></div>`;
  const chart = homeStudies.map(([, , target, , , meanWins, , regressionWins, total]) =>
    `<div class="wins-row"><span class="wins-target">${target}</span><div>
      ${bar(meanWins, total, 'mean')}${bar(regressionWins, total, 'regression')}</div></div>`
  ).join('');
  const rows = homeStudies.map(([hash, domain, target, period, base, meanWins, feature, regressionWins, total]) =>
    `<tr><th scope="row"><small>${domain}</small><a href="${hash}">${target}</a></th>
    <td data-label="検証年度">${period}</td><td data-label="比較基準">${base}</td>
    <td data-label="平均ずれ率補正">${meanWins}／${total}</td>
    <td data-label="回帰"><strong>${regressionWins}／${total}</strong><small>${feature}</small></td></tr>`
  ).join('');
  app.innerHTML = `<section class="home-summary"><div class="home-opening"><div><h1>年度の着地は、<br>当初予算・計画から<br>どこまで見通せるか</h1>
    <p class="home-intro">国の収入・支出・融資に関する8つの予測課題を取り上げます。当初予算・計画をそのまま使った場合と、過去のずれや経済指標で補正した場合で、どちらが年度実績に近かったかを比較します。</p></div>
    <section class="home-evidence"><h2>判断の根拠と限界</h2><p>各年度の当初予算成立日を情報の締切とし、年1回の予測を過去にさかのぼって再現しました。検証期間は課題ごとに12〜13年度です。改善した年度の割合は、この期間の成績を示します。各ページで年度別の誤差と、当時の資料を確認できた範囲を説明しています。</p></section></div>
    <div class="home-cases">
      <article><h2><a href="#debt">公債利子等支払</a></h2><p><strong>平均ずれ率による補正が毎年度の誤差を縮小。</strong>2014〜2025年度は全12年度で決算に近づきました。</p>
      <div class="case-error"><p>絶対誤差の中央値</p><dl><div><dt>当初予算</dt><dd>2兆539億円</dd></div><div><dt>平均ずれ率補正</dt><dd>3,510億円</dd></div></dl></div></article>
      <article><h2><a href="#fx">外為特会の運用収入</a></h2><p><strong>当初予算の方が誤差の中央値は小さい。</strong>2013〜2025年度に同じ補正で改善したのは13年度中2年度でした。</p>
      <div class="case-error"><p>絶対誤差の中央値</p><dl><div><dt>当初予算</dt><dd>2,359億円</dd></div><div><dt>平均ずれ率補正</dt><dd>2,816億円</dd></div></dl></div></article>
    </div>
    <h2>当初予算・計画より実績に近づいた年度の割合</h2>
    <figure class="wins-chart" aria-label="8分野の改善年度の割合">
      <figcaption>棒の長さは、当初予算・計画より誤差が小さかった年度の割合です。右の数字は改善年度数／検証年度数を示します。誤差が何円縮まったか、あるいは広がったかは、各課題の年度別グラフで確認できます。</figcaption>
      <div class="wins-key"><span class="mean">平均ずれ率補正（上段）</span><span class="regression">回帰（下段）</span></div>
      <div aria-hidden="true"><div class="wins-axis"><span>0%</span><span>50%</span><span>100%</span></div>${chart}</div>
    </figure>
    <h2 id="domains">予測課題一覧</h2>
    <table class="home-scores"><caption>予測対象を選ぶと、年度別の改善額・計算方法・出典を確認できます。各方式の欄は、改善した年度数／検証年度数です。</caption>
    <thead><tr><th scope="col">分野・予測対象</th><th scope="col">検証年度</th><th scope="col">比較基準</th><th scope="col">平均ずれ率補正</th><th scope="col">回帰・使用した指標</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="home-note">法人税収では名目GDP連動も比較し、12年度中6年度で改善しました。財政融資額の実績には、資金年度ベースの決算時点の見込値を用いています。</p></section>`;
}
