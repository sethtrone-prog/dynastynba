// Beta diagnostic only: tip-off candidates, NOT verified ESPN lineup locks.
// Do not use these provisional counts as official games used.
const LEAGUE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([5,6,8,9,10,11]);
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('Upstream '+r.status);return r.json();}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 try{
  const [league,board]=await Promise.all([json(LEAGUE+'?view=mRoster&view=mStatus'),json(NBA+'?dates='+new Date().toISOString().slice(0,10).replace(/-/g,''))]);
  const events=(board.events||[]).map(e=>({id:String(e.id),name:e.name,status:e.status?.type?.name||null,started:!!e.status?.type?.started,completed:!!e.status?.type?.completed,teams:(e.competitions?.[0]?.competitors||[]).map(c=>({id:Number(c.team?.id),name:c.team?.displayName}))}));
  // Diagnostic safeguard: ESPN fantasy proTeamId is not verified to match NBA scoreboard team.id.\n  // Never infer player event matches until an independently verified mapping exists.\n  const byProTeam=new Map();
  const teams=(league.teams||[]).map(t=>{
   const candidates=(t.roster?.entries||[]).filter(e=>ACTIVE.has(Number(e.lineupSlotId))).map(e=>{
    const p=e.playerPoolEntry?.player||{},event=byProTeam.get(Number(p.proTeamId));
    return {playerId:p.id??e.playerId,name:p.fullName||null,proTeamId:p.proTeamId??null,slot:e.lineupSlotId,eventId:event?.id||null,nbaGameStarted:!!event?.started,nbaGameCompleted:!!event?.completed,provisional:!!event?.started,verifiedAppearance:false};
   });
   return {teamId:t.id,provisionalTipoffCandidates:candidates.filter(c=>c.provisional).length,candidates};
  });
  res.status(200).json({ok:true,diagnostic:true,verified:false,source:'ESPN NBA scoreboard + current ESPN fantasy roster snapshot',warning:'Fantasy proTeamId to NBA scoreboard team ID mapping is unverified; player event matches are intentionally disabled. Current roster is not a historical tip-off lock. Provisional candidates must NOT be added to official games-used totals until lineup-at-tipoff can be verified. DNPs must be reconciled.',mappingVerified:false,scoringPeriod:league.status?.currentScoringPeriod??null,generatedAt:new Date().toISOString(),events,teams});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};
