function showJra() {
  const fmt = n => n.toLocaleString('ja-JP',{minimumFractionDigits:1,maximumFractionDigits:1});
  const signed = n => (n>0?'＋':n<0?'−':'')+fmt(Math.abs(n));
  const methods = ['当初予算','平均ずれ率補正','売得金回帰'];
  const summary = methods.map((name,i) => {
    const errors = jraResults.map(r=>Math.abs(r[2+i]-r[5])).sort((a,b)=>a-b);
    const wins = i ? jraResults.filter(r=>r[5+i]>0).length+' / 12' : '基準';
    return '<tr><th>'+name+'</th><td>'+fmt((errors[5]+errors[6])/2)+'</td><td>'+fmt(errors.reduce((a,b)=>a+b,0)/12)+'</td><td>'+wins+'</td></tr>';
  }).join('');
  const graph = document.createElementNS('http://www.w3.org/2000/svg','svg');
  graph.setAttribute('viewBox','0 0 840 296');
  graph.setAttribute('role','img');
  graph.setAttribute('aria-label','年度別の当初予算に対する誤差改善額。数値は下の年度別成績表に掲載。');
  const axis = v => 136-v*0.30;
  for (const v of [-400,-200,0,200,400]) {
    graph.innerHTML += '<line x1="54" x2="835" y1="'+axis(v)+'" y2="'+axis(v)+'" stroke="'+(v?'#d7dfe2':'#293e48')+'"/><text x="45" y="'+(axis(v)+5)+'" text-anchor="end">'+v+'</text>';
  }
  jraResults.forEach(([year,,,,,,mean,reg],i)=>{
    const x=85+64*i;
    for(const [v,offset,color] of [[mean,-17,'#8297a6'],[reg,1,'#126961']]){
      graph.innerHTML += '<rect x="'+(x+offset)+'" y="'+Math.min(axis(0),axis(v))+'" width="15" height="'+Math.abs(v)*0.3+'" fill="'+color+'"><title>'+year+'年度 '+(offset<0?methods[1]:methods[2])+' '+signed(v)+'億円</title></rect>';
    }
    graph.innerHTML += '<text x="'+x+'" y="285" text-anchor="middle">'+year+'</text>';
  });
  const rows = jraResults.map(([year,date,b,m,r,a,gm,gr])=>'<tr><th>'+year+'</th><td>'+date+'</td><td>'+fmt(b)+'</td><td>'+fmt(m)+'</td><td>'+fmt(r)+'</td><td>'+(year===2024?'約':'')+fmt(a)+'</td><td>'+signed(gm)+'</td><td>'+signed(gr)+'</td></tr>').join('');
  app.innerHTML = `<small>分野 02 ／ 税外収入</small><h1>JRA納付金の年度予測</h1>
    <p>当初予算の成立日に、日本中央競馬会（JRA）がその年度に国の一般会計に納める金額を予測します。2013〜2024年度の12回について、当時参照できた資料で予測を再現しました。</p>
    <section class="panel"><h2>当初予算より何億円、決算に近づいたか</h2>
    <p>ゼロ線より上は改善、下は悪化です。売得金回帰は12年度中7年度で改善しました。2018年度には誤差が約336億円拡大しています。</p>
    <p><span style="color:#526b7c">■ 平均ずれ率補正</span>　<span style="color:#126961">■ 売得金回帰</span>　単位：億円</p>
    <div class="jra-scroll"><div class="jra-plot">${graph.outerHTML}</div></div></section>
    <section class="panel"><h2>2013〜2024年度の検証結果</h2><div class="jra-scroll"><table><thead><tr><th>方式</th><th>絶対誤差の中央値（億円）</th><th>平均絶対誤差（億円）</th><th>改善年度数</th></tr></thead><tbody>${summary}</tbody></table></div></section>
    <section class="panel"><h2>3方式の入力と計算方法</h2>
    <p>2024年度を例に取ります。3方式とも、3月28日に成立した当初予算額を出発点とします。</p>
    <h3>① 当初予算をそのまま使う</h3><p>政府の見積額をその年度の予測額とします。2024年度の予測は<strong>3,699.7億円</strong>です。農林水産省は概算見積もりの段階で、売得金に基づく第一国庫納付金と剰余金に基づく第二国庫納付金を積み上げます。この比較には国会で成立した金額を使います。<a href="https://www.maff.go.jp/j/budget/attach/pdf/230901-1.pdf">農林水産省の積算内訳（2024年度・概算段階）</a></p>
    <h3>② 過去の平均ずれ率で補正する</h3><p>決算が予算を何％上回ったか、または下回ったかを「決算額 ÷ 当初予算額 − 1」で求めます。2013〜2022年度の10件では平均で7.73％上回ったため、2024年度も同じ割合を上乗せし、<strong>3,985.8億円</strong>と予測しました。</p>
    <h3>③ 前年の馬券の売れ行きで補正する（売得金回帰）</h3><p>売得金は、発売した馬券の金額から返還額を引いた額です。第一国庫納付金が売得金に連動するため、前年の国内売得金の伸び率を手掛かりにします。②と同じ10年度を使い、伸び率と予算のずれ率の関係を直線で推定します。</p>
    <p>2023暦年の売得金は2022暦年比で0.66％増でした。2024年度用の回帰式に入れると、予測ずれ率は約5.80％（5.26 ＋ 0.816 × 0.66）。これを当初予算に上乗せした予測額は<strong>3,914.3億円</strong>です。表示は丸め、計算には丸める前の係数と伸び率を使っています。</p>
    <p>2024年度の決算は約3,711億円で、①が最も近い結果でした。</p></section>

    <section class="panel"><h2>年度別の予測と決算</h2><p>金額は億円。改善額は「当初予算の絶対誤差 − 各方式の絶対誤差」です。2024年度の決算と改善額は概数です。</p>
    <div class="jra-scroll"><table><thead><tr><th>年度</th><th>予測日</th><th>当初予算</th><th>平均補正</th><th>売得金回帰</th><th>決算</th><th>平均補正の改善額</th><th>回帰の改善額</th></tr></thead><tbody>${rows}</tbody></table></div></section>
    <section class="panel"><h2>検証期間と出典</h2><p>予測年度を t とすると、学習期間は t−11〜t−2年度です。たとえば2013年度には2002〜2011年度の決算で学習し、2012暦年の売得金を2011暦年と比較しました。全12回で、学習に使う決算の国会提出日と、売得金の掲載資料が各予測日の締切までにそろうことを確認しています。</p>
    <p>売得金資料の日付は、遅くともその日までに値を確認できたことを示します。刊行年や月だけが分かる資料には保守的な日付を置いています。各PDFの初回掲載日時までは特定していません。</p>
    <p><a href="jra-data/results.csv" download>年度別成績CSV</a>　<a href="jra-data/sales.csv" download>売得金と出典</a>　<a href="jra-data/fiscal.csv" download>財政データと出典</a>　<a href="jra-data/submissions.csv" download>決算の提出日</a>　<a href="jra-data/reproduce.py" download>再計算用Python</a></p></section>`;
}
