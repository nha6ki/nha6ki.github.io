function createTraceScale(recordings) {
  const reference = 0.01;
  let peak = 0;
  for (const rows of recordings)
    for (const row of rows) peak = Math.max(peak, row.od);
  const range = Math.log1p((peak || 1) / reference);
  return (value) => Math.log1p(Math.max(0, value) / reference) / range;
}
function drawTrace(canvas, rows, second, scaleHeight) {
  const c = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  c.clearRect(0, 0, w, h);
  c.fillStyle = "#3b5064";
  c.fillRect(4, h / 2, w - 8, 1);
  c.strokeStyle = "#54edff";
  c.lineWidth = 4;
  c.lineJoin = "round";
  c.lineCap = "round";
  c.beginPath();
  let x, y;
  const first = Math.max(0, second - 14);
  for (let j = first; j <= second; j++) {
    x = 5 + ((14 - second + j) * (w - 10)) / 14;
    y = h - 5 - (h - 10) * scaleHeight(rows[j].od);
    if (j === first) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.fillStyle = "#ffcf62";
  c.beginPath();
  c.arc(x, y, 5, 0, 2 * Math.PI);
  c.fill();
}
