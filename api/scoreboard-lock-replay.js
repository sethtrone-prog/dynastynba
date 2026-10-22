const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([5,6,8,9,10,11]);
async function json(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Upstream HTTP '+r.status);return r.json()}
function etDate(d){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).map(x=>[x.type,x.value]));return p.year+p.month+p.day}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const date=String(req.query.date||etDate(new Date(Date.now()-86400000)));
 if(!/^20\d{6}$/.test(date))return res.status(400).json({ok:false,error:'Expected YYYYMMDD'});
 try{
  const settings=await json(BASE+'?view=mSettings&view=mStatus&view=mTeam');
  const mapping=settings.settings?.scheduleSettings?.matchupPeriods||{};
  const period=Number(req.query.period||1);
  const days=(mapping[String(period)]||[]).map(Number).filter(Number.isInteger);
  const day=Number(req.query.day||days[0]);
  if(!Number.isInteger(day)||day<1||day>200)return res.status(400).json({ok:false,error:'Invalid scoring period day'});
  const [box,nba]=await Promise.all([json(BASE+'?view=mBoxscore&matchupPeriodId='+period+'&scoringPeriodId='+day),json(NBA+'?dates='+date)]);
  const teamNames=new Map((settings.teams||[]).map(t=>[Number(t.id),t.name||'Team '+t.id]));
  const lineup=new Map();
  for(const matchup of box.schedule||[]){
   if(Number(matchup.matchupPeriodId)!==period)continue;
   for(const side of ['home','away']){
    const t=matchup[side];if(!t||!Array.isArray(t.rosterForCurrentScoringPeriod?.entries))continue;
    const players=t.rosterForCurrentScoringPeriod.entries.map(e=>({playerId:e.playerId??e.playerPoolEntry?.player?.id,slot:Number(e.lineupSlotId),proTeamId:e.playerPoolEntry?.player?.proTeamId??null,name:e.playerPoolEntry?.player?.fullName||null})).filter(p=>p.playerId);
    lineup.set(Number(t.teamId),{teamId:Number(t.teamId),name:teamNames.get(Number(t.teamId))||'Team '+t.teamId,players});
   }
  }
  const games=(nba.events||[]).map(e=>({gameId:String(e.id),start:e.date,state:e.status?.type?.state,status:e.status?.type?.name,nbaTeams:(e.competitions?.[0]?.competitors||[]).map(c=>({id:Number(c.team?.id),name:c.team?.displayName}))}));
  const results=[];
  for(const team of lineup.values()){
   const players=[];
   for(const player of team.players){
    const matching=games.filter(g=>g.nbaTeams.some(t=>t.id===Number(player.proTeamId)));
    players.push({...player,active:ACTIVE.has(player.slot),matchedGames:matching.map(g=>g.gameId),candidate:ACTIVE.has(player.slot)&&matching.length>0,warning:matching.length>1?'Multiple games matched':null});
   }
   results.push({teamId:team.teamId,name:team.name,activeGameCandidates:players.filter(p=>p.candidate).length,benchGameCandidates:players.filter(p=>!p.active&&p.matchedGames.length).length,players:players.filter(p=>p.matchedGames.length)});
  }
  const unmatched=results.flatMap(t=>t.players.filter(p=>p.proTeamId==null));
  return res.json({ok:true,date,matchupPeriodId:period,scoringPeriodId:day,espnDailyLineupTeams:lineup.size,nbaGames:games,teams:results,summary:{activeCandidates:results.reduce((n,t)=>n+t.activeGameCandidates,0),benchCandidates:results.reduce((n,t)=>n+t.benchGameCandidates,0),allTenTeams:lineup.size===10,unmatchedPlayers:unmatched.length},verified:false,interpretation:'Historical replay only: this is a candidate count based on ESPN day-specific boxscore slots and NBA schedule, not independently verified tipoff-frozen locks. Check NBA team ID mappings and compare against ESPN app before publishing.'});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message||e)})}
}