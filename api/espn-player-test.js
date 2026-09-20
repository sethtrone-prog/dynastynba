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
    if (!upstream.ok) {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      return res.status(502).send(body);
    }

    if (String(req.query.compact || '') === '1') {
      const data = JSON.parse(body);
      const rows = (data.players || []).map((entry) => {
        const p = entry.player || {};
        const stat = (p.stats || []).find((s) =>
          Number(s.seasonId) === Number(season) &&
          Number(s.statSourceId) === 0 &&
          Number(s.statSplitTypeId) === 0
        );
        const games = stat?.stats?.['42'] ?? null;
        return {
          player: p.fullName || null,
          espnId: p.id ?? entry.id ?? null,
          regularSeasonGamesPlayed: games,
          regularSeasonFantasyPoints: stat?.appliedTotal ?? null,
          regularSeasonFantasyPPG: stat?.appliedAverage ?? null,
          statSplitTypeId: stat?.statSplitTypeId ?? null,
          statSourceId: stat?.statSourceId ?? null,
          seasonId: stat?.seasonId ?? null
        };
      });
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      return res.status(200).json({season:Number(season),count:rows.length,players:rows});
    }

    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.status(200).send(body);
  } catch (error) {
    res.status(500).json({ok:false,error:String(error?.message || error)});
  }
}
