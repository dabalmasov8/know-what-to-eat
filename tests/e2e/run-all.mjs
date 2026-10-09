// Runs every e2e stage against BASE_URL (default http://localhost:8787, e.g.
// `npm run build && MOCK_GOOGLE=1 DAILY_CAP=100000 RATE_LIMIT_PER_MIN=100000 npm start`).
import { spawnSync } from 'node:child_process';
let failed = false;
for (const f of ['stage0', 'stage1', 'stage15', 'stage23', 'stage45', 'stage67', 'stage8']) {
  console.log(`\n== ${f}`);
  const r = spawnSync('node', [`tests/e2e/${f}.mjs`], { stdio: 'inherit' });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
