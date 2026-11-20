"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const names = Object.keys(collarRecords);
  const coats = [
    "#d28e50",
    "#8c8782",
    "#4c5154",
    "#b17c58",
    "#a6a4a0",
    "#d9be97",
    "#bf875c",
    "#ddd2ba",
    "#786867",
    "#b29c85",
    "#e4d7bb",
    "#90847a",
  ];

  const recordings = Object.values(collarRecords);
  const scaleHeight = createTraceScale(recordings);
  const field = $("field");
  const panel = $("panel");
  let language = savedLanguage();
  let elapsed = 0,
    last = performance.now(),
    selected = null;
  let order = [],
    jitter = [],
    trajectory;

  const pets = names.map((name, index) => {
    const button = document.createElement("button");
    button.className = "pet";
    button.innerHTML =
      '<canvas class="wave" width="224" height="50"></canvas><canvas class="sprite" width="240" height="136"></canvas><strong></strong><small></small>';
    button.querySelector("strong").textContent = name;
    button.onclick = () => {
      selected = index;
      panel.hidden = false;
      paint();
    };
    field.append(button);
    return {
      button,
      wave: button.children[0],
      cat: button.children[1],
      caption: button.querySelector("small"),
      lastRow: -1,
    };
  });
  function shuffle() {
    order = names.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    jitter = names.map(() => [Math.random(), Math.random()]);
    layout();
  }
  function layout() {
    const f = field,
      cols = f.clientWidth < 620 ? 3 : 4,
      rows = Math.ceil(names.length / cols),
      w = f.clientWidth / cols,
      h = f.clientHeight / rows;
    const bw = Math.min(116, w - 8),
      bh = Math.min(110, h - 4);
    const arena = { width: f.clientWidth, height: f.clientHeight, bw, bh };
    const initial = pets.map(({ button: b }, i) => {
      const slot = order[i];
      b.style.width = bw + "px";
      b.style.height = bh + "px";
      return {
        x: (slot % cols) * w + 4 + jitter[i][0] * Math.max(0, w - bw - 8),
        y:
          Math.floor(slot / cols) * h +
          2 +
          jitter[i][1] * Math.max(0, h - bh - 4),
        angle: 2 * Math.PI * jitter[i][0],
      };
    });
    trajectory = createTrajectory(initial, arena, recordings);
    paint();
  }

  function paint() {
    const second = Math.floor(elapsed);
    const fraction = elapsed - second;
    const path = trajectory(second);
    for (const [index, pet] of pets.entries()) {
      const rows = recordings[index];
      const rowIndex = second % rows.length;
      const row = rows[rowIndex];
      const behavior = describeBehavior(row.behavior);
      const from = path.from[index],
        to = path.to[index];
      pet.button.style.left = from.x + (to.x - from.x) * fraction + "px";
      pet.button.style.top = from.y + (to.y - from.y) * fraction + "px";
      pet.cat.style.transform = Math.cos(to.angle) < 0 ? "scaleX(-1)" : "";
      if (pet.lastRow !== rowIndex) {
        drawTrace(pet.wave, rows, rowIndex, scaleHeight);
        pet.caption.textContent = behavior[language];
        pet.lastRow = rowIndex;
      }
      drawCat(pet.cat, coats[index], behavior.pose, rowIndex + fraction);
      if (index === selected) {
        $("name").textContent = names[index];
        $("info").textContent = [
          behavior[language],
          row.behavior,
          row.utc,
          "ODBA15_Mean  " + row.od.toFixed(3),
          "VM_Mean  " + row.vm.toFixed(3),
        ].join("\n");
      }
    }
  }
  function tick(now) {
    elapsed += (Math.max(0, now - last) * Number($("speed").value)) / 1000;
    last = now;
    paint();
    requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange", () => {
    last = performance.now();
  });
  $("mix").onclick = shuffle;
  $("close").onclick = () => {
    selected = null;
    $("panel").hidden = true;
  };
  $("language").onclick = () => {
    language = language === "ja" ? "en" : "ja";
    for (const pet of pets) pet.lastRow = -1;
    rememberLanguage(language);
    applyLanguage(language);
    paint();
  };
  applyLanguage(language);
  shuffle();
  new ResizeObserver(layout).observe(field);
  last = performance.now();
  requestAnimationFrame(tick);
})();
