const copy = {
  ja: {
    speedLabel: "再生速度",
    mix: "配置をシャッフル",
    about: "表示情報",
    close: "閉じる",
    waveHeading: "波形の読み方",
    scale:
      "水色の線は、首輪の加速度から求めた動きの強さを1秒ごとに示します。横幅は15秒、縦軸は全猫共通で、小さな変化が見えるよう対数目盛り（log1p）を使っています。右端の黄色い点が再生中の値です。",
    replayHeading: "猫の動き",
    explain: "観察記録に合わせて、猫のしぐさを1秒ごとに表示します。",
    recordHelp:
      "猫を選ぶと、その秒の観察ラベル、記録時刻、センサー値を確認できます。",
    source: "実測データの出典",
    citation: "Michelle Smit（2023）行動注釈・加速度データ",
    field: "12匹の猫の観察フィールド",
    language: "English",
  },
  en: {
    speedLabel: "Speed",
    mix: "Shuffle positions",
    about: "About",
    close: "Close",
    waveHeading: "Reading the trace",
    scale:
      "The cyan line shows movement intensity derived from collar acceleration, one value per second. Each plot spans 15 seconds and uses a shared logarithmic scale (log1p) to make small changes visible. The yellow dot on the right marks the current value.",
    replayHeading: "Reading the animation",
    explain:
      "For recorded data, each pose represents the behavior observed that second.",
    recordHelp:
      "Select a cat to see its observed behavior label, timestamp and sensor values for the current second.",
    source: "Recording source",
    citation:
      "Michelle Smit (2023), behavior annotations and accelerometer data",
    field: "Observation area for 12 cats",
    language: "日本語",
  },
};

function savedLanguage() {
  try {
    return localStorage.getItem("feliadapt-language") === "en" ? "en" : "ja";
  } catch {
    return "ja";
  }
}

function applyLanguage(language) {
  const { field, recordHelp, ...labels } = copy[language];
  document.documentElement.lang = language;
  for (const [id, label] of Object.entries(labels))
    document.getElementById(id).textContent = label;
  document.getElementById("language").lang = language === "ja" ? "en" : "ja";
  document.getElementById("field").setAttribute("aria-label", field);
  document.getElementById("dataHelp").textContent = recordHelp;
}

function rememberLanguage(language) {
  try {
    localStorage.setItem("feliadapt-language", language);
  } catch {
    /* Playback also works when browser storage is unavailable. */
  }
}
