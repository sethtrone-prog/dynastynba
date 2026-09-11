const ESPN_BASE = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID = '76513288';

export default async function handler(req, res) {
  const season = String(req.query.season || '2026').replace(/[^0-9]/g, '') || '2026';
  const url = `${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?view=kona_player_info&view=kona_playercard`;
  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'dynastynba.com salary engine test',
        'x-fantasy-filter': JSON.stringify({players:{limit:2000,sortPercOwned:{sortPriority:1,sortAsc:false}}})
      }
    });
    const body = await upstream.text();
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.status(upstream.ok ? 200 : 502).send(body);
  } catch (error) {
    res.status(500).json({ok:false,error:String(error?.message || error)});
  }
}
