import { describe, expect, it } from 'vitest';
import { segmentAt, targetRotation } from '../src/lib/wheel';

describe('wheel geometry', () => {
  it('target rotation lands on the chosen segment for any count/index/jitter', () => {
    for (const count of [2, 3, 5, 7, 12, 24]) {
      for (let i = 0; i < count; i++) {
        for (const j of [-1, -0.5, 0, 0.5, 1]) expect(segmentAt(targetRotation(i, count, 6, j), count)).toBe(i);
      }
    }
  });
});
