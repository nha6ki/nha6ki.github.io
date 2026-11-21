function navigate() {
  if (location.hash === '#corporate') {
    document.title = '法人税収の年度予測｜日本財政の予測と検証';
    showCorporate();
  } else if (location.hash === '#jra') {
    document.title = 'JRA納付金の年度予測｜日本財政の予測と検証';
    showJra();
  } else if (location.hash === '#pension') {
    document.title = '厚生年金保険料収入の年度予測｜日本財政の予測と検証';
    showPension();
  } else if (location.hash === '#allocation') {
    document.title = '地方交付税の年度予測｜日本財政の予測と検証';
    showAllocation();
  } else if (location.hash === '#filp') {
    document.title = '財政融資額の年度予測｜日本財政の予測と検証';
    showFilp();
  } else if (location.hash === '#debt') {
    document.title = '公債利子等支払の年度予測｜日本財政の予測と検証';
    showDebt();
  } else if (location.hash === '#fx') {
    document.title = '外為特会の運用収入の年度予測｜日本財政の予測と検証';
    showFx();
  } else if (location.hash === '#patent') {
    document.title = '特許料等収入の年度予測｜日本財政の予測と検証';
    showPatent();
  } else {
    document.title = '日本財政の予測と検証';
    showHome();
  }
  if (location.hash === '#domains') document.getElementById('domains').scrollIntoView();
  else window.scrollTo(0, 0);
}
window.addEventListener('hashchange', navigate);
navigate();
