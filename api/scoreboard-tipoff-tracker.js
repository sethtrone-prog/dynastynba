// Diagnostic only. Tip-off is not proof of an actual appearance or historical lineup lock.
const LEAGUE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([5,6,8,9,10,11]);
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('Upstream '+r.status);return r.json();}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const date=String(req.query.date||new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replace(/-/g,''));
 if(!/^\d{8}$/.test(date))return res.status(400).json({ok:false,error:'date must be YYYYMMDD'});
 try{
  const [league,board]=await Promise.all([json(LEAGUE+'?view=mRoster&view=mStatus'),json(NBA+'?dates='+date)]);
  const hasStarted=status=>!['STATUS_SCHEDULED','STATUS_POSTPONED','STATUS_CANCELED','STATUS_DELAYED','STATUS_TIME_TBD'].includes(status)&&!!status;\n  const events=(board.events||[]).map(e=>({id:String(e.id),name:e.name,status:e.status?.type?.name||null,started:hasStarted(e.status?.type?.name),completed:e.status?.type?.name==='STATUS_FINAL'||!!e.status?.type?.completed,teams:(e.competitions?.[0]?.competitors||[]).map(c=>({id:Number(c.team?.id),name:c.team?.displayName}))}));
  // Both APIs expose ESPN NBA team IDs; report candidate joins but do not assert lineup lock.
  const byProTeam=new Map(events.flatMap(e=>e.teams.map(t=>[t.id,e])));
  const teams=(league.teams||[]).map(t=>{
   const candidates=(t.roster?.entries||[]).filter(e=>ACTIVE.has(Number(e.lineupSlotId))).map(e=>{
    const p=e.playerPoolEntry?.player||{},event=byProTeam.get(Number(p.proTeamId));
    return {playerId:p.id??e.playerId,name:p.fullName||null,proTeamId:p.proTeamId??null,slot:e.lineupSlotId,eventId:event?.id||null,nbaGameStarted:!!event?.started,nbaGameCompleted:!!event?.completed,provisional:!!event?.started,verifiedAppearance:false,lineupAtTipoffVerified:false};
   });
   return {teamId:t.id,provisionalTipoffCandidates:candidates.filter(c=>c.provisional).length,candidates};
  });
  res.status(200).json({ok:true,diagnostic:true,verified:false,date,generatedAt:new Date().toISOString(),source:'ESPN fantasy current roster + ESPN NBA scoreboard',warning:'Tip-off candidates only. Current roster snapshots do not prove lineup-at-tipoff; NBA game start does not prove player appearance. Do not add these counts to official games-used until lineup lock and DNP reconciliation are validated.',events,teams});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};