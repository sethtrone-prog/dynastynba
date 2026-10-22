// Beta-only: current-day lock observations. Not a persistent weekly games-used ledger.
const LEAGUE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
async function read(url){const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'DynastyNBA live locks beta'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function dateET(now){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return p.year+p.month+p.day}
const bench=new Set([20,21,22,23,24,25,26,27,28,29,30]);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 try{
  const now=new Date(),date=dateET(now);
  const [league,nba]=await Promise.all([read(LEAGUE+'?view=mRoster&view=mSettings&view=mStatus'),read(NBA+'?dates='+date)]);
  const events=(nba.events||[]).map(e=>({id:e.id,teams:(e.competitions?.[0]?.competitors||[]).map(c=>Number(c.team?.id)),start:e.date,status:e.status?.type?.name||'',state:e.status?.type?.state||''}));
  const started=events.filter(e=>new Date(e.start)<=now&&e.state!=='pre'&&e.state!=='postponed'&&e.status!=='STATUS_POSTPONED');
  const roster=(league.teams||[]).map(t=>{
   const entries=t.roster?.entries||[];
   const locked=entries.filter(e=>!bench.has(Number(e.lineupSlotId))&&started.some(g=>g.teams.includes(Number(e.playerPoolEntry?.player?.proTeamId))));
   return {teamId:t.id,teamName:t.name,rosterEntries:entries.length,observedStartedPlayers:locked.map(e=>({playerId:e.playerId,slot:e.lineupSlotId,proTeamId:e.playerPoolEntry?.player?.proTeamId}))};
  });
  res.json({ok:true,mode:'experimental-current-roster',verified:false,date,scoringPeriodId:league.scoringPeriodId??null,updatedAt:now.toISOString(),gamesToday:events.length,startedGames:started.length,teamsWithRoster:roster.filter(t=>t.rosterEntries>0).length,teams:roster,warning:'These are current-roster observations only, NOT authoritative locked snapshots or cumulative weekly games used. Slot exclusions and NBA team mappings require verification. A server-side persistent lock ledger is needed before publishing counts.'});
 }catch(e){res.status(502).json({ok:false,error:'Live lineup observation unavailable',detail:e.message})}
}