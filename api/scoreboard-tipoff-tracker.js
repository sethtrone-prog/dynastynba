// Diagnostic only. Tip-off is not proof of an actual appearance or historical lineup lock.
const LEAGUE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([5,6,8,9,10,11]);
const {scoringDate}=require('./_scoring-day');
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('Upstream '+r.status);return r.json();}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const date=String(req.query.date||scoringDate());
 if(!/^\d{8}$/.test(date))return res.status(400).json({ok:false,error:'date must be YYYYMMDD'});
 try{
  const [league,board]=await Promise.all([json(LEAGUE+'?view=mRoster&view=mStatus'),json(NBA+'?dates='+date)]);
  const hasStarted=status=>!['STATUS_SCHEDULED','STATUS_POSTPONED','STATUS_CANCELED','STATUS_DELAYED','STATUS_TIME_TBD'].includes(status)&&!!status;
  const events=(board.events||[]).map(e=>({id:String(e.id),name:e.name,status:e.status?.type?.name||null,started:hasStarted(e.status?.type?.name),completed:e.status?.type?.name==='STATUS_FINAL'||!!e.status?.type?.completed,teams:(e.competitions?.[0]?.competitors||[]).map(c=>({id:Number(c.team?.id),name:c.team?.displayName}))}));
  // Cross-check ESPN NBA boxscore athlete IDs before trusting fantasy proTeamId joins.
  const summaries=await Promise.all(events.filter(e=>e.started).map(async e=>{try{const s=await json('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event='+e.id);const athletes=[];for(const group of s.boxscore?.players||[]){const nbaTeamId=Number(group.team?.id);for(const stat of group.statistics||[])for(const a of stat.athletes||[])athletes.push({id:String(a.athlete?.id),nbaTeamId,didNotPlay:!!a.didNotPlay,stats:a.stats||[],labels:stat.labels||[]});}return {eventId:e.id,athletes,available:athletes.length>0};}catch(error){return {eventId:e.id,athletes:[],available:false,error:String(error.message)}}}));
  const byAthlete=new Map(summaries.flatMap(s=>s.athletes.map(a=>[a.id,{...a,eventId:s.eventId}])));
  // Current lineup is diagnostic only; not proof of a historical lock.
  const byProTeam=new Map(events.flatMap(e=>e.teams.map(t=>[t.id,e])));
  const teams=(league.teams||[]).map(t=>{
   const candidates=(t.roster?.entries||[]).filter(e=>ACTIVE.has(Number(e.lineupSlotId))).map(e=>{
    const p=e.playerPoolEntry?.player||{},event=byProTeam.get(Number(p.proTeamId));
    const athlete=byAthlete.get(String(p.id??e.playerId));const minutesIndex=athlete?.labels?.findIndex(l=>String(l).toUpperCase()==='MIN')??-1;const minutesRaw=minutesIndex>=0?athlete?.stats?.[minutesIndex]:null;const minutesValue=minutesRaw===null||minutesRaw===undefined?null:parseFloat(String(minutesRaw));const appeared=!!athlete&&!athlete.didNotPlay&&Number.isFinite(minutesValue)&&minutesValue>0;const identityMatch=!!athlete&&athlete.eventId===event?.id&&athlete.nbaTeamId===Number(p.proTeamId);
    return {playerId:p.id??e.playerId,name:p.fullName||null,proTeamId:p.proTeamId??null,slot:e.lineupSlotId,eventId:event?.id||null,nbaGameStarted:!!event?.started,nbaGameCompleted:!!event?.completed,provisional:!!event?.started,boxscorePlayerFound:!!athlete,boxscoreEventId:athlete?.eventId||null,boxscoreTeamId:athlete?.nbaTeamId??null,identityMatch,identityConflict:!!athlete&&!identityMatch,boxscoreDNP:athlete?.didNotPlay??null,minutesPlayed:minutesRaw,liveAppearanceCandidate:identityMatch&&appeared,verifiedAppearance:false,lineupAtTipoffVerified:false};
   });
   return {teamId:t.id,provisionalTipoffCandidates:candidates.filter(c=>c.provisional).length,liveAppearanceCandidates:candidates.filter(c=>c.liveAppearanceCandidate).length,candidates};
  });
  res.status(200).json({ok:true,diagnostic:true,verified:false,date,scoringPeriodId:Number(league.status?.currentScoringPeriod||league.scoringPeriodId||0),generatedAt:new Date().toISOString(),source:'ESPN fantasy current roster + ESPN NBA scoreboard',boxscoreCoverage:summaries.map(s=>({eventId:s.eventId,available:s.available,athletes:s.athletes.length,error:s.error||null})),warning:'Live appearance candidates require positive NBA boxscore MIN and matching player/team IDs, but current roster is NOT a verified historical tipoff lineup. Do not publish or combine with finalized-day totals until lineup-lock evidence and deduplication are implemented. Tip-off candidates only. Current roster snapshots do not prove lineup-at-tipoff; NBA game start does not prove player appearance. Do not add these counts to official games-used until lineup lock and DNP reconciliation are validated.',events,teams});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};