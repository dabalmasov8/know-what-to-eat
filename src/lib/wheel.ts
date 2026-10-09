/** Rotation (degrees, clockwise) that puts the middle of segment `index` under the top pointer, after `turns` full spins. */
export function targetRotation(index: number, count: number, turns: number, jitter = 0): number {
  const slice = 360 / count;
  return turns * 360 - (index + 0.5) * slice + jitter * slice * 0.35;
}

/** Which segment is under the pointer for a given total rotation. */
export function segmentAt(rotation: number, count: number): number {
  const slice = 360 / count;
  const angle = (((-rotation % 360) + 360) % 360) / slice;
  return Math.floor(angle) % count;
}
