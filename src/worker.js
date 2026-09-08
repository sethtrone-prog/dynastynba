const ESPN_BASE = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID = '76513288';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, site: 'dynastynba.com', leagueId: LEAGUE_ID, checkedAt: new Date().toISOString() });
    }
    if (url.pathname === '/api/espn/current') {
      const season = url.searchParams.get('season') || '2026';
      const views = ['mTeam','mRoster','mStandings','mMatchupScore','mSettings'];
      const qs = views.map(v => `view=${encodeURIComponent(v)}`).join('&');
      const upstream = await fetch(`${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${qs}`, {
        headers: { 'User-Agent': 'dynastynba.com league reference' }
      });
      if (!upstream.ok) return Response.json({ ok:false, status:upstream.status }, { status:502 });
      return new Response(upstream.body, { headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'public, max-age=300' }});
    }
    return env.ASSETS.fetch(request);
  }
};
