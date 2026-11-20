function advance(from, second, arena, recordings) {
  const next = from.map((p) => ({ ...p }));
  next.forEach((p, i) => {
    const rows = recordings[i];
    const behavior = rows[second % rows.length].behavior;
    const { speed } = describeBehavior(behavior);
    if (!speed) return;
    const heading = p.angle + 0.16 * Math.sin(second * 0.23 + i);
    for (const turn of [
      0,
      0.45,
      -0.45,
      0.9,
      -0.9,
      1.5,
      -1.5,
      2.2,
      -2.2,
      Math.PI,
    ]) {
      const angle = heading + turn,
        x = p.x + speed * Math.cos(angle),
        y = p.y + speed * Math.sin(angle);
      if (
        x < 0 ||
        x + arena.bw > arena.width ||
        y < 0 ||
        y + arena.bh > arena.height
      )
        continue;
      // Reserve the swept rectangle so labels and traces stay apart between ticks.
      const blocked = next.some(
        (other, k) =>
          k !== i &&
          Math.min(x, p.x) < Math.max(other.x, from[k].x) + arena.bw &&
          Math.max(x, p.x) + arena.bw > Math.min(other.x, from[k].x) &&
          Math.min(y, p.y) < Math.max(other.y, from[k].y) + arena.bh &&
          Math.max(y, p.y) + arena.bh > Math.min(other.y, from[k].y),
      );
      if (!blocked) {
        Object.assign(p, { x, y, angle });
        break;
      }
    }
  });
  return next;
}

// The playback clock moves forward. Keep only the two positions used for interpolation.
function createTrajectory(initial, arena, recordings) {
  let second = 0,
    from = initial,
    to = advance(from, 0, arena, recordings);
  return (target) => {
    while (second < target) {
      from = to;
      second++;
      to = advance(from, second, arena, recordings);
    }
    return { from, to };
  };
}
