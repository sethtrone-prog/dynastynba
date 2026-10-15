// NBA regular-season standings only. No fantasy standings or play-in seeds.
export function normalizeStandings(data, season) {
  const east = data.children?.find(group => String(group.id) === '5');
  const standings = east?.standings;
  if (Number(standings?.season) !== season || Number(standings?.seasonType) !== 2 || standings?.entries?.length !== 15) {
    throw new Error('Regular-season conference standings unavailable');
  }
  const teams = standings.entries.map(entry => {
    const stat = name => entry.stats?.find(s => s.name === name)?.value;
    const wins = stat('wins'), losses = stat('losses'), seed = stat('playoffSeed');
    if (!Number.isInteger(wins) || !Number.isInteger(losses) || wins < 0 || losses < 0) throw new Error('Invalid standings record');
    return { id: String(entry.team.id), name: entry.team.displayName, wins, losses,
      position: Number.isInteger(seed) && seed >= 1 && seed <= 15 ? seed : null };
  });
  const started = teams.some(team => team.wins + team.losses > 0);
  // Do not declare a final result until every Eastern team completes its schedule.
  const final = teams.every(team => team.wins + team.losses >= 82);
  return { season, conferenceId: '5', started, final, teams };
}
export default async function handler(req, res) {
  const season = Number(req.query.season || 2027);
  if (!Number.isInteger(season) || season < 2027 || season > 2100) return res.status(400).json({ ok: false, error: 'Invalid season' });
  try {
    const url = `https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${season}&seasontype=2&level=2`;
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('ESPN unavailable');
    const standings = normalizeStandings(await response.json(), season);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
    return res.json({ ok: true, ...standings, updatedAt: new Date().toISOString(), source: 'ESPN' });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, error: 'Live NBA standings are temporarily unavailable. Please try again shortly.' });
  }
}
