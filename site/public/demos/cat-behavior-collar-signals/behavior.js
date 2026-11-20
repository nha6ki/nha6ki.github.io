const behaviorDefinitions = [
  {
    matches: /Maintenance_Grooming/,
    ja: "毛づくろい",
    en: "Grooming",
    pose: "groom",
    speed: 0,
  },
  {
    matches: /Scratch/,
    ja: "体をかく",
    en: "Scratching",
    pose: "scratch",
    speed: 0,
  },
  { matches: /Walking/, ja: "歩く", en: "Walking", pose: "walk", speed: 15 },
  {
    matches: /Trotting/,
    ja: "小走り",
    en: "Trotting",
    pose: "walk",
    speed: 21,
  },
  { matches: /Running/, ja: "走る", en: "Running", pose: "run", speed: 30 },
  {
    matches: /Jumping.Vertical/,
    ja: "垂直ジャンプ",
    en: "Vertical jump",
    pose: "jump",
    speed: 0,
  },
  {
    matches: /Jumping.Horizontal/,
    ja: "水平ジャンプ",
    en: "Horizontal jump",
    pose: "leap",
    speed: 0,
  },
  { matches: /Sitting/, ja: "座る", en: "Sitting", pose: "sit", speed: 0 },
  { matches: /Lying/, ja: "横になる", en: "Lying down", pose: "lie", speed: 0 },
  { matches: /Standing/, ja: "立つ", en: "Standing", pose: "stand", speed: 0 },
  {
    matches: /Rubbing/,
    ja: "こすりつける",
    en: "Rubbing",
    pose: "rub",
    speed: 0,
  },
  { matches: /Shake/, ja: "身を振る", en: "Shaking", pose: "shake", speed: 0 },
  { matches: /Climbing/, ja: "登る", en: "Climbing", pose: "climb", speed: 0 },
  { matches: /Eating/, ja: "食べる", en: "Eating", pose: "eat", speed: 0 },
  { matches: /Drinking/, ja: "飲む", en: "Drinking", pose: "eat", speed: 0 },
  { matches: /Rolling/, ja: "転がる", en: "Rolling", pose: "roll", speed: 0 },
  {
    matches: /Allogrooming/,
    ja: "仲間の毛づくろい",
    en: "Social grooming",
    pose: "groom",
    speed: 0,
  },
  {
    matches: /Social.Human/,
    ja: "人との交流",
    en: "Human interaction",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /Defecating/,
    ja: "排便",
    en: "Defecating",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /Urinating/,
    ja: "排尿",
    en: "Urinating",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /Digging/,
    ja: "砂を掘る",
    en: "Digging",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /Littering.None/,
    ja: "トイレ内",
    en: "In litter box",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /Fighting/,
    ja: "けんか",
    en: "Fighting",
    pose: "neutral",
    speed: 0,
  },
  { matches: /Playing/, ja: "遊ぶ", en: "Playing", pose: "neutral", speed: 0 },
  {
    matches: /Outofsight/,
    ja: "視野外",
    en: "Out of sight",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /ActigraphOff/,
    ja: "センサー装着外",
    en: "Sensor off",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /Other_Start/,
    ja: "開始",
    en: "Start",
    pose: "neutral",
    speed: 0,
  },
  {
    matches: /Other_Other/,
    ja: "その他",
    en: "Other",
    pose: "neutral",
    speed: 0,
  },
];
const behaviorCache = new Map();
function describeBehavior(label) {
  if (!behaviorCache.has(label)) {
    const definition = behaviorDefinitions.find((entry) =>
      entry.matches.test(label),
    );
    behaviorCache.set(
      label,
      definition ?? { ja: label, en: label, pose: "neutral", speed: 0 },
    );
  }
  return behaviorCache.get(label);
}
