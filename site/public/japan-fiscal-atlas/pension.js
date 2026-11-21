async function showPension() {
  app.textContent = '検証データを読み込んでいます。';
  let data;
  try {
    const response = await fetch('pension-data.json');
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    if (location.hash === '#pension') app.textContent = '検証データを読み込めませんでした。ページを再読み込みしてください。';
    return;
  }
  if (location.hash !== '#pension') return;
  const fmt = n => n.toFixed(2);
  const table = (headers, rows) => '<div class="fiscal-scroll"><table class="fiscal-table"><thead><tr>' +
    headers.map(h => '<th scope="col">'+h+'</th>').join('') + '</tr></thead><tbody>' +
    rows.map(([year,...cells]) => '<tr><th scope="row">'+year+'</th>'+cells.map(c => '<td>'+c+'</td>').join('')+'</tr>').join('') + '</tbody></table></div>';
  const years = data.年度別資料;
  const results = data.共通検証;
  const names = data.方式順;
  const errors = results.map(r => r.予測兆円.map(v => Math.abs(v-r.決算兆円)));
  const gains = errors.map(row => row.map(e => row[0]-e));
  const signed = n => (n<0?'−':'＋')+fmt(Math.abs(n));
  const summary = names.map((name,j) => {
    const values = errors.map(row => row[j]).sort((a,b)=>a-b);
    return [name,fmt(values[6]),fmt(values.reduce((a,b)=>a+b)/values.length),
      j ? gains.filter(row=>row[j]>0).length+'／13' : '基準'];
  });
  const ticks = [-0.5,0,0.5,1].map(v => {
    const y = 147-v*119;
    return `<line x1="58" x2="880" y1="${y}" y2="${y}" stroke="${v===0?'#223941':'#d8dfe1'}"/><text x="48" y="${y+5}" text-anchor="end">${v}</text>`;
  }).join('');
  const bars = results.map((r,i) => {
    const x = 89 + i*63;
    const pair = [1,2].map(j => {
      const v = gains[i][j];
      return `<rect x="${x+(j===1?-18:1)}" y="${147-Math.max(v,0)*119}" width="17" height="${Math.abs(v)*119}" fill="${j===1?'#647f92':'#126961'}"><title>${r.年度}年度 ${names[j]} ${signed(v)}兆円</title></rect>`;
    }).join('');
    return pair+`<text x="${x}" y="244" text-anchor="middle">${r.年度}</text>`;
  }).join('');
  const outputs = results.map((r,i)=>[r.年度,...r.予測兆円.map(fmt),fmt(r.決算兆円),...gains[i].slice(1).map(signed)]);
  const training = results.map(r=>[r.年度,r.成立日,r.学習年度[0]+'〜'+r.学習年度.at(-1),signed(r.予算前年比*100)+'％']);
  const sources = years.map(y=>[y.年度,'<a href="'+(y.予算出典||'https://www.mhlw.go.jp/wp/yosan/kaiji/nenkin11-1.html')+'">'+fmt(y.当初予算百万円/1e6)+'</a>',
    '<a href="'+(y.決算出典||'https://www.mhlw.go.jp/content/001360068.pdf')+'">'+fmt(y.決算億円/10000)+'</a>']);
  app.innerHTML = `<small>分野 03 ／ 年金と保険と子育て</small><h1>厚生年金保険料収入の年度予測</h1>
    <p>当初予算の成立日に、その年度に国の厚生年金勘定に入る保険料収入を予測します。2013〜2025年度の各予算成立時点を再現し、同じ13年度で3方式を比較しました。</p>
    <section class="panel"><h2>当初予算より何兆円、決算に近づいたか</h2>
    <p>ゼロ線より上は誤差が縮んだ年度、下は誤差が広がった年度です。どちらの補正も13年度中9年度で改善しました。</p>
    <p><span style="color:#526b7c">■ 平均ずれ率補正</span>　<span style="color:#126961">■ 予算前年比回帰</span>　単位：兆円</p>
    <div class="jra-scroll"><div class="jra-plot"><svg viewBox="0 0 900 258" role="img" aria-label="2013〜2025年度の当初予算に対する絶対誤差の改善額。各値は年度別の表に掲載。">${ticks}${bars}</svg></div></div>
    <h3>2013〜2025年度の検証結果</h3>${table(['方式','絶対誤差の中央値（兆円）','絶対誤差の平均（兆円）','当初予算より改善'],summary)}
    <p>回帰と平均ずれ率補正を直接比べると、回帰の誤差が小さいのは7年度、大きいのは6年度でした。2021年度は予算が前年比2.97％減り、回帰は31.28兆円と予測しましたが、決算は33.35兆円まで伸びました。</p></section>
    <section class="panel"><h2>3方式の入力と計算方法</h2>
    <h3>① 当初予算</h3><p>成立した予算の保険料収入額を、そのまま予測額にします。</p>
    <h3>② 平均ずれ率補正</h3><p>各年度のずれ率を「決算額 ÷ 当初予算額 − 1」で求めます。予測額は「当年度の当初予算額 ×（1 ＋ 直近10件の平均ずれ率）」です。</p>
    <h3>③ 予算前年比回帰</h3><p>入力は「当年度の当初予算額 ÷ 前年度の当初予算額 − 1」です。政府が予算をどれだけ増減させたかによって、決算のずれ方が変わるかを調べます。</p>
    <p>過去10件で「ずれ率 ＝ 切片 ＋ 係数 × 予算前年比」を当てはめます。予測額は「当年度の当初予算額 ×（1 ＋ 推定したずれ率）」です。前年比とずれ率は式には小数で入れます。</p></section>
    <section class="panel"><h2>年度別の予測と決算（兆円）</h2>${table(['年度',...names,'決算実績','平均ずれ率補正の改善額','回帰の改善額'],outputs)}
    <p>改善額は当初予算の絶対誤差から各方式の絶対誤差を引いた値です。計算には丸める前の数値を使いました。</p></section>
    <section class="panel"><h2>予測時点と学習年度</h2><p>②と③は予測日に決算が公表済みの直近10年度を使います。最初の2013年度予測では2002〜2011年度が該当します。③の当年度の入力は、成立した予算と前年度の当初予算だけで計算できます。</p>
    ${table(['予測年度','予算成立日','学習に使った10年度','予算前年比'],training)}</section>
    <section class="panel"><h2>資料と再計算用データ</h2><details><summary>2002〜2025年度の当初予算と決算（兆円）</summary>
    <p>2002〜2006年度は厚生保険特別会計・年金勘定、2007年度以降は年金特別会計・厚生年金勘定の保険料収入です。2002年度の前年比には<a href="${data.前年比較の起点.出典}">2001年度予算の公表値（209,482億円）</a>を使いました。</p>${table(['年度','当初予算・原資料','決算実績・原資料'],sources)}</details>
    <details><summary>参考検証：加入者数と報酬を使った回帰</summary><p>被保険者数と平均標準報酬月額の積の前年同月比から、予算のずれ率を推定した結果です。予算成立日までの公表を確認できた資料で10年度を学習できるのは、2023〜2025年度の3回です。</p>
    ${table(['年度','加入者・報酬による予測（兆円）','決算実績（兆円）'],data.参考検証.共通検証.map(r=>[r.年度,fmt(r.予測兆円[2]),fmt(r.決算兆円)]))}</details>
    <p><a href="pension-data.json" download>年度別データ・回帰係数・予測結果（JSON）</a></p></section>`;
}
