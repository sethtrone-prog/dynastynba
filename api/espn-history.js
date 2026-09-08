const ESPN_BASE = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID = '76513288';
const DEFAULT_SEASONS = [2019,2020,2021,2022,2023,2024,2025,2026];

function countRosterEntries(teams) {
  return (teams || []).reduce((sum, team) => sum + (team?.roster?.entries?.length || 0), 0);
}

function compactTeam(team) {
  return {
    id: team?.id ?? null,
    name: team?.name || [team?.location, team?.nickname].filter(Boolean).join(' ') || null,
    abbrev: team?.abbrev || null,
    wins: team?.record?.overall?.wins ?? null,
    losses: team?.record?.overall?.losses ?? null,
    ties: team?.record?.overall?.ties ?? null,
    pointsFor: team?.record?.overall?.pointsFor ?? null,
    pointsAgainst: team?.record?.overall?.pointsAgainst ?? null,
    playoffSeed: team?.playoffSeed ?? null,
    finalStanding: team?.rankCalculatedFinal ?? team?.currentProjectedRank ?? null
  };
}

function compactMatchup(m) {
  return {
    id: m?.id ?? null,
    matchupPeriodId: m?.matchupPeriodId ?? null,
    winner: m?.winner ?? null,
    playoffTierType: m?.playoffTierType ?? null,
    home: m?.home ? { teamId: m.home.teamId ?? null, score: m.home.totalPoints ?? null } : null,
    away: m?.away ? { teamId: m.away.teamId ?? null, score: m.away.totalPoints ?? null } : null
  };
}

async function fetchSeason(season) {
  const views = ['mTeam','mRoster','mStandings','mMatchupScore','mSettings','mSchedule'];
  const qs = views.map(v => `view=${encodeURIComponent(v)}`).join('&');
  const url = `${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${qs}`;
  const upstream = await fetch(url, { headers: { 'User-Agent': 'dynastynba.com historical archive inventory' } });

  if (!upstream.ok) {
    return { season, ok: false, status: upstream.status };
  }

  const data = await upstream.json();
  const teams = data?.teams || [];
  const schedule = data?.schedule || [];
  const regularSeasonMatchupPeriods = Number(data?.settings?.scheduleSettings?.matchupPeriodCount || 0);
  const playoffMatchups = schedule.filter(m => {
    if (m?.playoffTierType && m.playoffTierType !== 'NONE') return true;
    return regularSeasonMatchupPeriods && Number(m?.matchupPeriodId || 0) > regularSeasonMatchupPeriods;
  });

  return {
    season,
    ok: true,
    espnSeasonId: data?.seasonId ?? season,
    leagueName: data?.settings?.name || null,
    teamCount: teams.length,
    rosterEntryCount: countRosterEntries(teams),
    scheduleCount: schedule.length,
    regularSeasonMatchupPeriods: regularSeasonMatchupPeriods || null,
    playoffTeamCount: data?.settings?.scheduleSettings?.playoffTeamCount ?? null,
    playoffMatchupCount: playoffMatchups.length,
    previousSeasons: Array.isArray(data?.status?.previousSeasons) ? data.status.previousSeasons : [],
    teams: teams.map(compactTeam),
    playoffMatchups: playoffMatchups.map(compactMatchup)
  };
}

export default async function handler(req, res) {
  const requested = String(req.query.seasons || '').trim();
  const seasons = requested
    ? requested.split(',').map(v => Number(String(v).replace(/[^0-9]/g, ''))).filter(v => v >= 2010 && v <= 2100)
    : DEFAULT_SEASONS;

  const uniqueSeasons = [...new Set(seasons)].sort((a,b) => a-b);
  try {
    const results = [];
    for (const season of uniqueSeasons) {
      try {
        results.push(await fetchSeason(season));
      } catch (error) {
        results.push({ season, ok: false, error: 'ESPN request failed' });
      }
    }

    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 's-maxage=1800, stale-while-revalidate=300');
    return res.status(200).json({
      ok: true,
      leagueId: LEAGUE_ID,
      generatedAt: new Date().toISOString(),
      seasons: results
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Historical ESPN inventory failed' });
  }
}
