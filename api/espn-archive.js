const ESPN_BASE = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID = '76513288';

function teamName(team) {
  return team?.name || [team?.location, team?.nickname].filter(Boolean).join(' ') || `Team ${team?.id ?? ''}`.trim();
}

function cleanRoster(team) {
  return (team?.roster?.entries || []).map((entry, index) => {
    const p = entry?.playerPoolEntry?.player || {};
    return {
      playerId: p.id ?? entry?.playerId ?? null,
      name: p.fullName || p.displayName || p.name || null,
      proTeamId: p.proTeamId ?? null,
      lineupSlotId: entry?.lineupSlotId ?? null,
      order: index
    };
  }).filter(x => x.name);
}

function cleanTeam(team) {
  const overall = team?.record?.overall || {};
  return {
    id: team?.id ?? null,
    name: teamName(team),
    abbrev: team?.abbrev || null,
    wins: overall.wins ?? null,
    losses: overall.losses ?? null,
    ties: overall.ties ?? null,
    pointsFor: overall.pointsFor ?? null,
    pointsAgainst: overall.pointsAgainst ?? null,
    percentage: overall.percentage ?? null,
    playoffSeed: team?.playoffSeed ?? null,
    finalStanding: team?.rankCalculatedFinal ?? team?.currentProjectedRank ?? null,
    roster: cleanRoster(team)
  };
}

function cleanSide(side) {
  if (!side) return null;
  return {
    teamId: side.teamId ?? null,
    score: side.totalPoints ?? null,
    cumulativeScore: side.cumulativeScore?.score ?? null
  };
}

function cleanMatchup(m) {
  return {
    id: m?.id ?? null,
    matchupPeriodId: Number(m?.matchupPeriodId || 0),
    winner: m?.winner ?? null,
    playoffTierType: m?.playoffTierType ?? null,
    home: cleanSide(m?.home),
    away: cleanSide(m?.away)
  };
}

export default async function handler(req, res) {
  const season = Number(String(req.query.season || '2026').replace(/[^0-9]/g, ''));
  if (!season || season < 2010 || season > 2100) return res.status(400).json({ ok:false, error:'Invalid season' });

  const views = ['mTeam','mRoster','mStandings','mMatchupScore','mSettings','mSchedule'];
  const qs = views.map(v => `view=${encodeURIComponent(v)}`).join('&');
  const url = `${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${qs}`;

  try {
    const upstream = await fetch(url, { headers: { 'User-Agent': 'dynastynba.com historical archive' } });
    if (!upstream.ok) return res.status(502).json({ ok:false, season, status:upstream.status });
    const data = await upstream.json();
    const regularSeasonMatchupPeriods = Number(data?.settings?.scheduleSettings?.matchupPeriodCount || 0);
    const teams = (data?.teams || []).map(cleanTeam);
    const schedule = (data?.schedule || []).map(cleanMatchup);
    const regularSeason = schedule.filter(m => m.matchupPeriodId > 0 && (!regularSeasonMatchupPeriods || m.matchupPeriodId <= regularSeasonMatchupPeriods));
    const playoffs = schedule.filter(m => (m.playoffTierType && m.playoffTierType !== 'NONE') || (regularSeasonMatchupPeriods && m.matchupPeriodId > regularSeasonMatchupPeriods));

    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({
      ok:true,
      leagueId:LEAGUE_ID,
      season,
      leagueName:data?.settings?.name || null,
      regularSeasonMatchupPeriods: regularSeasonMatchupPeriods || null,
      playoffTeamCount:data?.settings?.scheduleSettings?.playoffTeamCount ?? null,
      teams,
      regularSeason,
      playoffs
    });
  } catch (error) {
    return res.status(500).json({ ok:false, season, error:'ESPN archive request failed' });
  }
}
