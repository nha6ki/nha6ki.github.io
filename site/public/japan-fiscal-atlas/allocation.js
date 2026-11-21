async function showAllocation() {
  app.textContent = '地方交付税の検証結果を読み込んでいます。';
  let data;
  try {
    const response = await fetch('local-allocation.json');
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    if (location.hash === '#allocation') app.textContent = 'データを読み込めませんでした。ページを再読み込みしてください。';
    return;
  }
  if (location.hash !== '#allocation') return;
  const {methods, results, history} = data;
  const amount = n => Math.round(n).toLocaleString('ja-JP');
  const signed = n => (n<0?'−':n>0?'＋':'')+amount(Math.abs(n));
  const table = (headers,rows) => '<div class="fiscal-scroll"><table class="fiscal-table"><thead><tr>'+
    headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(([label,...values])=>'<tr><th scope="row">'+label+'</th>'+values.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>';
  const axis = v => 160-v/47;
  const grid = [-2000,0,2000,4000,6000].map(v =>
    `<line x1="62" x2="890" y1="${axis(v)}" y2="${axis(v)}" stroke="${v?'#d7dfe2':'#243841'}"/><text x="54" y="${axis(v)+5}" text-anchor="end">${amount(v)}</text>`).join('');
  const bars = results.map((r,i)=>{
    const x = 94+63*i;
    return [1,2].map(j=>{
      const gain = r.gains[j];
      return `<rect x="${x+(j===1?-18:1)}" y="${Math.min(axis(0),axis(gain))}" width="16" height="${Math.abs(gain)/47}" fill="${j===1?'#647f92':'#126961'}"><title>${r.year}年度 ${methods[j]} ${signed(gain)}億円</title></rect>`;
    }).join('')+`<text x="${x}" y="234" text-anchor="middle">${r.year}</text>`;
  }).join('');
  const scores = data.summary.map((s,i)=>[methods[i],amount(s.median),amount(s.mean),i?s.wins+'／'+results.length:'基準']);
  const forecasts = results.map(r=>[r.year,...r.forecasts.map(amount),amount(r.actual),...r.gains.slice(1).map(signed)]);
  const training = results.map(r=>[r.year,r.date,r.train[0]+'〜'+r.train.at(-1),(100*r.growth).toFixed(2)+'％']);
  const sources = history.map(r=>[r.year,'<a href="'+r.planSource+'">'+amount(r.plan)+'</a>',r.actual===null?'—':amount(r.actual),
    r.actualSources.map((url,i)=>'<a href="'+url+'">'+(r.actualSources.length===1?'全国額':i?'特別交付税':'普通交付税')+'</a>').join(' ／ ')]);
  const evidence = history.filter(r => r.availability).map(r => {
    const first = results.find(prediction => prediction.train.includes(r.year));
    const links = r.availability.sources.map(s => `<a href="${s.url}">${s.title}</a>`);
    return [r.year, amount(r.actual), r.availability.documentDate, first.date, links.join(' ／ ')];
  });
  app.innerHTML = `<small>分野 04 ／ 政策支出と地方移転</small><h1>地方交付税の年度予測</h1>
    <p>国の当初予算が成立した日に、その年度に全国の自治体に交付される普通交付税と特別交付税の合計を予測します。比較の基準は地方財政計画の当初額（自治体が受け取る額。出口ベース）です。震災復興特別交付税は別枠として除いています。</p>
    <section class="panel"><h2>当初計画より何億円、交付実績に近づいたか</h2>
    <p>棒がゼロ線より上なら誤差が縮小し、下なら拡大しました。2020年度は当初計画と実績が億円単位で一致しました。2025年度には実績が当初計画を約1.31兆円上回り、前年比回帰によって誤差が約0.52兆円縮まりました。</p>
    <p><span style="color:#526b7c">■ 平均ずれ率補正</span>　<span style="color:#126961">■ 計画額の前年比回帰</span>　単位：億円</p>
    <div class="jra-scroll"><div class="jra-plot"><svg viewBox="0 0 905 249" role="img" aria-label="2013〜2025年度の絶対誤差改善額。年度別の数値は下表に掲載。">${grid}${bars}</svg></div></div>
    <h3>2013〜2025年度の検証結果（億円）</h3>${table(['方式','絶対誤差の中央値','絶対誤差の平均','当初計画より改善'],scores)}
    <p>計画額の前年比を使う回帰は、絶対誤差の中央値・平均ともに3方式で最小でした。平均ずれ率補正は、大幅に上振れした年度の誤差を抑えて平均を改善する一方、中央値は当初計画を上回りました。</p></section>
    <section class="panel"><h2>3方式の入力と計算方法</h2>
    <h3>① 当初計画額</h3><p>地方財政計画の「地方交付税の総額（通常収支分）」を予測額にします。国の一般会計から特別会計への繰入額とは区別します。</p>
    <h3>② 平均ずれ率補正</h3><p>過去の各年度について「ずれ率 ＝ 交付実績 ÷ 当初計画額 − 1」を計算します。予測額は「当年度の当初計画額 ×（1 ＋ 過去10年度の平均ずれ率）」です。</p>
    <h3>③ 計画額の前年比回帰</h3><p>入力は「当年度の当初計画額 ÷ 前年度の当初計画額 − 1」です。過去10年度で「ずれ率 ＝ 切片 ＋ 係数 × 計画額の前年比」を推定し、当年度の計画額に「1 ＋ 推定ずれ率」を掛けます。年度中の補正・再算定額は実績の確認にだけ使います。</p></section>
    <section class="panel"><h2>年度別の予測額と交付実績（億円）</h2>
    ${table(['年度',...methods,'実績','平均ずれ率の改善額','回帰の改善額'],forecasts)}
    <p>計画額と実績を億円に統一してから計算し、予測と改善額は最後に丸めています。2025年度の実績は、再算定後の普通交付税の都道府県分・市町村分と年間の特別交付税を、公表された億円単位で合算した概算です。</p></section>
    <section class="panel"><h2>各予測に使った期間</h2>
    <p>2002〜2025年度の24件を収集しました。予測年度の11年前から2年前までの10件を使います。最初の2013年度予測の学習期間は2002〜2011年度です。2001年度の計画額は2002年度の前年比の計算にだけ使います。</p>
    ${table(['予測年度','国の当初予算成立日','学習年度','計画額の前年比'],training)}</section>
    <section class="panel"><h2>原資料と検証データ</h2>
    <p>2002〜2020年度の交付実績19件は、それぞれを初めて学習に使う予測日までの資料で確認できました。例えば、2011年度の実績は2013年3月の福井県の全国表に掲載され、同年5月15日の予測に間に合っています。</p>
    <details><summary>交付実績をいつ確認できたか（19年度の出典表）</summary>
    <p>「確認できた時点」は、遅くともその時点で実績を把握できたことを示します。資料の国会提出日・委員会への配付日・刊行年月などを用い、初回公表日は特定していません。</p>
    ${table(['実績年度','全国の交付実績（億円）','確認できた時点','最初に学習に使った予測日','確認資料'],evidence)}
    <h3>2013年度の実績を決算から求める</h3>
    <p>決算の地方交付税交付金には震災復興分が含まれます。復興分の支出額は、前年度からの繰越額670,413,604,000円から不用額163,339,731,000円を引いた507,073,873,000円です。</p>
    <p>支出済額17,595,453,518,000円 − 復興分507,073,873,000円 ＝ 17,088,379,645,000円。億円単位に丸めた<strong>170,884億円</strong>を採用しました。計算に必要な金額は、最初に学習に使った2015年4月9日までに確認できます。</p>
    <p><a href="https://www.city.kawasaki.jp/980/cmsfiles/contents/0000057/57063/261006soumu2-1.pdf">川崎市の委員会資料</a>にある同年度の全国決定額は170,721億円です。決算から求めた額と163億円異なる理由は未確認です。</p></details>
    <details><summary>当初計画・交付実績の出典を見る</summary>
    ${table(['年度','当初計画（億円）','実績（億円）','実績の出典'],sources)}
    <p>2002〜2020年度の実績値は、熊本県「市町村財政の概要」の全国表（冊子41頁）から取得しました。上の出典表で当時の資料と照合しています。</p></details>
    <p><a href="local-allocation.json" download>全年度の入力・出典・予測・回帰係数をダウンロード（JSON）</a></p></section>`;
}
