import fs from 'node:fs';
import path from 'node:path';

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

function winnerId(matchup) {
  if (!matchup?.home || !matchup?.away) return null;
  if (matchup.winner === 'HOME') return matchup.home.teamId;
  if (matchup.winner === 'AWAY') return matchup.away.teamId;
  const home = Number(matchup.home.score);
  const away = Number(matchup.away.score);
  if (!Number.isFinite(home) || !Number.isFinite(away) || home === away) return null;
  return home > away ? matchup.home.teamId : matchup.away.teamId;
}

function buildSummary(teams, playoffs, playoffTeamCount) {
  const finalStandings = teams.slice().sort((a, b) => {
    const af = Number(a.finalStanding), bf = Number(b.finalStanding);
    if (Number.isFinite(af) && Number.isFinite(bf) && af !== bf) return af - bf;
    return (Number(a.playoffSeed) || 99) - (Number(b.playoffSeed) || 99);
  }).map((t, index) => ({
    position: Number.isFinite(Number(t.finalStanding)) ? Number(t.finalStanding) : index + 1,
    teamId: t.id,
    teamName: t.name,
    wins: t.wins,
    losses: t.losses,
    ties: t.ties,
    pointsFor: t.pointsFor,
    pointsAgainst: t.pointsAgainst,
    playoffSeed: t.playoffSeed
  }));

  const playoffTeams = teams
    .filter(t => Number(t.playoffSeed) > 0 && (!playoffTeamCount || Number(t.playoffSeed) <= Number(playoffTeamCount)))
    .sort((a, b) => Number(a.playoffSeed) - Number(b.playoffSeed))
    .map(t => ({ teamId: t.id, teamName: t.name, seed: Number(t.playoffSeed) }));

  const winnersBracket = playoffs.filter(m => !m.playoffTierType || m.playoffTierType === 'WINNERS_BRACKET');
  let champion = null;
  let runnerUp = null;
  let finalMatchup = null;
  if (winnersBracket.length) {
    const lastPeriod = Math.max(...winnersBracket.map(m => Number(m.matchupPeriodId || 0)));
    finalMatchup = winnersBracket.find(m => Number(m.matchupPeriodId || 0) === lastPeriod && m.home && m.away) || null;
    const win = winnerId(finalMatchup);
    if (win != null) {
      const lose = Number(finalMatchup.home.teamId) === Number(win) ? finalMatchup.away.teamId : finalMatchup.home.teamId;
      champion = teams.find(t => Number(t.id) === Number(win)) || null;
      runnerUp = teams.find(t => Number(t.id) === Number(lose)) || null;
    }
  }

  return {
    status: champion ? 'complete' : 'in_progress',
    champion: champion ? { teamId: champion.id, teamName: champion.name } : null,
    runnerUp: runnerUp ? { teamId: runnerUp.id, teamName: runnerUp.name } : null,
    playoffTeams,
    finalStandings,
    finalMatchup
  };
}

function archivedSeasonPath(season) {
  return path.join(process.cwd(), 'public', 'espn-archive', `${season}.json`);
}

function readArchivedSeason(season) {
  const file = archivedSeasonPath(season);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const season = Number(String(req.query.season || '2026').replace(/[^0-9]/g, ''));
  if (!season || season < 2010 || season > 2100) return res.status(400).json({ ok:false, error:'Invalid season' });

  const forceLive = String(req.query.source || '').toLowerCase() === 'live';
  if (!forceLive) {
    const archived = readArchivedSeason(season);
    if (archived?.ok) {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ ...archived, archived:true });
    }
  }

  const views = ['mTeam','mRoster','mStandings','mMatchupScore','mSettings','mSchedule'];
  const qs = views.map(v => `view=${encodeURIComponent(v)}`).join('&');
  const url = `${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?${qs}`;

  try {
    const upstream = await fetch(url, { headers: { 'User-Agent': 'dynastynba.com historical archive' } });
    if (!upstream.ok) return res.status(502).json({ ok:false, season, status:upstream.status });
    const data = await upstream.json();
    const regularSeasonMatchupPeriods = Number(data?.settings?.scheduleSettings?.matchupPeriodCount || 0);
    const playoffTeamCount = data?.settings?.scheduleSettings?.playoffTeamCount ?? null;
    const teams = (data?.teams || []).map(cleanTeam);
    const schedule = (data?.schedule || []).map(cleanMatchup);
    const regularSeason = schedule.filter(m => m.matchupPeriodId > 0 && (!regularSeasonMatchupPeriods || m.matchupPeriodId <= regularSeasonMatchupPeriods));
    const playoffs = schedule.filter(m => (m.playoffTierType && m.playoffTierType !== 'NONE') || (regularSeasonMatchupPeriods && m.matchupPeriodId > regularSeasonMatchupPeriods));
    const summary = buildSummary(teams, playoffs, playoffTeamCount);

    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({
      ok:true,
      archived:false,
      leagueId:LEAGUE_ID,
      season,
      leagueName:data?.settings?.name || null,
      regularSeasonMatchupPeriods: regularSeasonMatchupPeriods || null,
      playoffTeamCount,
      teams,
      regularSeason,
      playoffs,
      summary
    });
  } catch (error) {
    return res.status(500).json({ ok:false, season, error:'ESPN archive request failed' });
  }
}
