// Beta: finalized-day games-used totals, recalculated automatically on requests.
// Counts only eligible starters with a recorded NBA box score (minutes > 0).
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const STARTER=new Set([5,6,8,9,10,11]);
const calendar=require('./_matchup-calendar');
const {scoringDate,scoringPeriodForDate}=require('./_scoring-day');
async function espn(q){const r=await fetch(ROOT+'?'+q,{headers:{'User-Agent':'DynastyNBA daily games-used beta'}});if(!r.ok)throw Error('ESPN '+r.status);return r.json();}
function dayEvidence(entry,day){
 const p=entry.playerPoolEntry?.player||{};
 const stats=(p.stats||[]).filter(s=>Number(s.scoringPeriodId)===day&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===5);
 // ESPN stat 40 is minutes played, independently observed in the matchup boxscore.
 const actual=stats.find(s=>s.stats&&Object.keys(s.stats).length>0);
 return {playerId:p.id??entry.playerId??null,name:p.fullName||null,slot:entry.lineupSlotId,hasBoxScore:!!actual,minutesPlayed:actual?.stats?.['40']??null,statKeys:actual?Object.keys(actual.stats):[],playedCandidate:!!actual&&Number(actual.stats?.['40'])>0&&STARTER.has(entry.lineupSlotId)};
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=10');
 const period=Number(req.query.period||1),endOverride=req.query.through===undefined?null:Number(req.query.through);
 if(!Number.isInteger(period)||period<1||period>30||endOverride!==null&&(!Number.isInteger(endOverride)||endOverride<1||endOverride>250))return res.status(400).json({ok:false,error:'Invalid period'});
 try{
  const base=await espn('view=mSettings&view=mStatus&view=mSchedule&view=mTeam');
  const currentMatchup=calendar.currentMatchup();
  const boundary=calendar.periodDays(period);
  if(!boundary)return res.status(400).json({ok:false,error:'Unknown matchup period'});
  const {start,end,startDate,endDate}=boundary;
  const weeklyCap=period===1?23:27;
  // A day is not finalized until 3 AM Los Angeles time (6 AM Eastern).
  const todayPeriod=scoringPeriodForDate(scoringDate());
  const through=endOverride??Math.min(end,todayPeriod-1);
  const last=Math.min(through,end);
  const completed=last>=start?Array.from({length:last-start+1},(_,i)=>start+i):[];
  if(completed.length>14)return res.status(400).json({ok:false,error:'Too many scoring days'});
  const fetched=await Promise.all(completed.map(async d=>({day:d,data:await espn('view=mRoster&scoringPeriodId='+d)})));
  const ids=new Set((base.teams||[]).map(t=>t.id));
  for(const m of base.schedule||[]){if(m.home?.teamId)ids.add(m.home.teamId);if(m.away?.teamId)ids.add(m.away.teamId);}
  // Empty new weeks must still return all franchises before any NBA games finalize.
  for(const f of fetched)for(const t of f.data.teams||[])ids.add(t.id);
  const teams=[...ids].sort((a,b)=>a-b).map(teamId=>{
   const events=fetched.flatMap(f=>(f.data.teams||[]).filter(t=>t.id===teamId).flatMap(t=>(t.roster?.entries||[]).map(e=>({...dayEvidence(e,f.day),day:f.day})).filter(x=>x.playedCandidate)));
   return {teamId,gamesUsedCandidate:events.length,gamesRemainingCandidate:Math.max(0,weeklyCap-events.length),gamesOverCap:Math.max(0,events.length-weeklyCap),overCap:events.length>weeklyCap,display:'Played '+events.length+'/'+weeklyCap,rawEligibleAppearances:events.length,events};
  });
  return res.status(200).json({ok:true,verified:false,season:2027,period,weeklyCap,through,matchupStartScoringPeriod:start,nextMatchupStartScoringPeriod:end+1,matchupStartDate:startDate,matchupEndDate:endDate,boundarySource:'2026-27 league matchup calendar (Oct 18 handoff)',completedScoringPeriods:completed,refresh:'Automatic on request; CDN cache 30 seconds',note:'Candidate counts require ESPN stat 40 minutes > 0 and an eligible active slot. All qualifying appearances count, including overages; ESPN scoring adjustments are handled manually.',teams});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
}