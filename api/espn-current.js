const ESPN_BASE = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID = '76513288';

export default async function handler(req, res) {
  const season = String(req.query.season || '2026').replace(/[^0-9]/g, '') || '2026';
  const views = ['mTeam','mRoster','mStandings','mMatchupScore','mSettings'];
  const qs = views.map(v => `view=${encodeURIComponent(v)}`).join('&');
  try {
    const upstream = await fetch(`${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${qs}`, {
      headers: { 'User-Agent': 'dynastynba.com league reference' }
    });
    if (!upstream.ok) return res.status(502).json({ ok:false, status:upstream.status });
    const body = await upstream.text();
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).send(body);
  } catch (error) {
    res.status(500).json({ ok:false, error:'ESPN upstream request failed' });
  }
}
