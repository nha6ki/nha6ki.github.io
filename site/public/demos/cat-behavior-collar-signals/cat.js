// Side-view illustrations use the same coordinate system for all coat colours.
const outlines = new Map();
function outline(d) {
  if (!outlines.has(d)) outlines.set(d, new Path2D(d));
  return outlines.get(d);
}
function drawCat(canvas, fur, pose, t) {
  const c = canvas.getContext("2d"),
    cream = "#f2dfc3",
    ink = "#483a32",
    stripe = "#594536";
  const wave = Math.sin(t * (pose === "run" ? 12 : 7)),
    seated = ["sit", "groom", "scratch"].includes(pose);
  const prone = pose === "lie" || pose === "roll",
    walking = ["walk", "run", "leap", "climb"].includes(pose);
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.clearRect(0, 0, 120, 68);
  function fill(d, color) {
    c.fillStyle = color;
    c.fill(outline(d));
  }
  function line(d, color, width) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke(outline(d));
  }
  c.save();
  fill("M15 62 Q59 57 104 62 Q69 66 15 62", "#ccd8c8");
  if (pose === "jump" || pose === "leap" || pose === "climb")
    c.translate(0, -9 * Math.abs(Math.sin(Math.PI * t)));
  if (pose === "roll") {
    c.translate(61, 45);
    c.rotate(0.23 * wave);
    c.translate(-61, -45);
  }
  function leg(x, y, stride, hind, far) {
    c.save();
    c.translate(x, y);
    c.rotate(stride);
    const d = hind
      ? "M-7 -1 Q-11 7 -5 13 L0 16 L-2 21 C-5 28 9 27 10 23 Q10 20 5 20 L9 13 Q10 10 6 7 L5 0 Z"
      : "M-5 -2 Q-6 5 -3 13 L-3 22 C-4 27 10 27 10 23 Q10 20 5 20 L6 8 L5 -2 Z";
    fill(d, fur);
    if (far) fill(d, "rgba(65,47,36,.22)");
    c.restore();
  }
  const stride = walking ? 0.43 * wave : 0;
  if (!seated && !prone) {
    leg(43, 36, -stride, true, true);
    leg(77, 36, stride, false, true);
  }
  if (seated) {
    fill(
      "M38 53 C31 44 37 31 46 25 C55 20 63 22 67 11 L79 15 C78 26 83 33 78 43 L79 56 Q88 56 86 60 Q82 62 73 60 L69 44 Q65 56 59 58 C53 62 41 61 38 53Z",
      fur,
    );
    line("M39 51 C22 53 23 64 41 61 Q54 58 65 60", fur, 7);
    line("M47 40 Q61 38 62 49 Q61 54 56 56 Q65 54 68 58", stripe, 1.1);
    fill("M67 24 Q71 25 76 20 Q79 30 77 35 L74 45 Q73 31 67 24", cream);
  } else if (prone) {
    fill(
      "M23 54 C18 45 26 34 39 34 C52 32 65 40 76 36 Q86 35 92 48 L103 54 Q109 59 99 59 L79 56 Q56 63 32 58 Z",
      fur,
    );
    line("M34 53 Q12 62 9 51 Q7 47 10 45", fur, 6);
  } else {
    c.save();
    c.translate(39, 32);
    c.rotate(0.09 * wave);
    line("M0 4 C-13 7 -19 -2 -18 -14 C-18 -23 -25 -23 -26 -18", fur, 5.5);
    c.restore();
    fill(
      "M31 34 C30 22 44 18 57 22 Q73 27 82 19 L89 24 Q92 39 80 44 Q66 53 49 45 Q32 49 31 34 Z",
      fur,
    );
    leg(41, 36, stride, true, false);
    leg(79, 36, -stride, false, false);
  }
  // Tapered tabby markings follow the upper silhouette.
  c.save();
  c.translate(seated ? 44 : prone ? 33 : 42, seated ? 31 : prone ? 35 : 24);
  c.rotate(seated ? -0.55 : 0.08);
  c.globalAlpha = 0.5;
  fill(
    "M0 0 Q4 -1 7 0 Q7 6 4 9 Q5 4 0 0 M11 0 Q15 0 17 1 Q17 5 14 8 Q15 4 11 0 M22 1 Q25 1 28 2 Q27 6 25 7 Z",
    stripe,
  );
  c.restore();
  const grooming = pose === "groom",
    eating = pose === "eat";
  c.save();
  c.translate(seated ? 73 : prone ? 83 : 85, seated ? 21 : prone ? 40 : 23);
  c.rotate(
    grooming
      ? 0.67 + 0.12 * wave
      : eating
        ? 0.61 + 0.09 * wave
        : pose === "rub"
          ? 0.23 * wave
          : pose === "shake"
            ? 0.16 * wave
            : 0.03,
  );
  // A three-quarter face keeps both eyes and whisker pads visible in profile.
  fill(
    "M-17 -5 Q-18 -10 -17 -17 Q-16 -20 -13 -18 L-6 -13 Q0 -15 7 -12 L13 -17 Q16 -19 16 -15 L16 -6 C23 3 20 12 13 15 C6 19 -9 18 -15 12 Q-22 5 -17 -5Z",
    fur,
  );
  fill(
    "M-15 -15 Q-15 -17 -13 -15 L-9 -12 L-15 -9Z M11 -11 L14 -14 L14 -9Z",
    "#dcaa9e",
  );
  fill("M-2 -13 L1 -13 L1 -8 Z M3 -13 L6 -12 L4 -8Z", stripe);
  fill(
    "M-4 8 C-4 4 1 3 5 6 C8 3 13 4 14 8 C15 14 8 16 4 14 C-2 15 -6 13 -4 8Z",
    cream,
  );
  const sleepy = grooming || prone;
  if (sleepy) {
    line("M-9 2 Q-6 -1 -3 2 M8 1 Q11 -2 14 1", ink, 1.7);
  } else {
    fill(
      "M-10 0 C-10 -5 -3 -5 -3 0 C-3 6 -10 6 -10 0Z M8 -1 C8 -5 14 -5 14 -1 C14 5 8 5 8 -1Z",
      "#302e31",
    );
    fill(
      "M-8 -2 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 M9 -2 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0",
      "#fff9ed",
    );
  }
  fill("M2 6 Q5 4 8 6 Q8 8 5 9 Q2 8 2 6Z", "#9e6868");
  line("M5 9 Q4 12 1 10 M5 9 Q6 12 9 10", ink, 0.9);
  line(
    "M-7 7 Q-15 5 -23 6 M-7 9 Q-16 9 -22 12 M13 6 Q20 4 25 5 M14 9 Q21 8 25 10",
    ink,
    1.05,
  );
  c.restore();
  if (grooming) {
    c.save();
    c.translate(72, 39);
    c.rotate(0.11 * wave);
    line("M0 0 Q-2 4 -5 0 L4 -9", fur, 6);
    line("M3 -8 L5 -11", cream, 5);
    c.restore();
  }
  if (pose === "scratch") {
    c.save();
    c.translate(53, 49);
    c.rotate(0.17 * wave);
    line("M0 0 Q-2 -8 7 -10 L17 -22", fur, 7);
    line("M16 -21 L18 -24", cream, 5);
    c.restore();
  }
  c.restore();
}
