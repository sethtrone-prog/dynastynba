import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.DYNASTY_SITE_URL || 'https://www.dynastynba.com';
const now = new Date();
const candidateSeason = now.getUTCMonth() >= 7 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
const startSeason = Number(process.env.ESPN_ARCHIVE_START_SEASON || 2019);
const requestedSeason = process.argv[2] ? Number(process.argv[2]) : null;
const seasons = requestedSeason ? [requestedSeason] : Array.from({ length: Math.max(0, candidateSeason - startSeason + 1) }, (_, i) => startSeason + i);
const outDir = path.join(process.cwd(), 'public', 'espn-archive');

await fs.mkdir(outDir, { recursive: true });

let created = 0;
for (const season of seasons) {
  const file = path.join(outDir, `${season}.json`);
  try {
    await fs.access(file);
    console.log(`${season}: already archived`);
    continue;
  } catch {}

  const url = `${base}/api/espn-archive?season=${season}&source=live`;
  const response = await fetch(url, { headers: { 'User-Agent': 'dynastynba-season-archiver' } });
  if (!response.ok) {
    console.log(`${season}: ESPN feed unavailable (${response.status})`);
    continue;
  }

  const data = await response.json();
  if (!data?.ok || data?.summary?.status !== 'complete') {
    console.log(`${season}: season not complete`);
    continue;
  }

  const snapshot = {
    ...data,
    archived:true,
    archivedAt:new Date().toISOString(),
    archiveVersion:1
  };
  delete snapshot.error;
  await fs.writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  created++;
  console.log(`${season}: archived ${snapshot.summary?.champion?.teamName || 'completed season'}`);
}

console.log(`Created ${created} new ESPN season snapshot(s).`);
