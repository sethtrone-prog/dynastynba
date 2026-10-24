// Beta: finalized-day games-used totals, recalculated automatically on requests.
// Counts only eligible starters with a recorded NBA box score (minutes > 0).
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const STARTER=new Set([0,1,2,3,4,5,6,7,8,9,10,11]);
async function espn(q){const r=await fetch(ROOT+'?'+q,{headers:{'User-Agent':'DynastyNBA daily games-used beta'}});if(!r.ok)throw Error('ESPN '+r.status);return r.json();}
function dayEvidence(entry,day){
 const p=entry.playerPoolEntry?.player||{};
 const stats=(p.stats||[]).filter(s=>Number(s.scoringPeriodId)===day&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===5);
 // ESPN stat 0 is points, NOT games played. Stat 34 is minutes in this ESPN feed,
 // but must be verified against an actual box score before official use.
 const actual=stats.find(s=>s.stats&&Object.keys(s.stats).length>0);
 return {playerId:p.id??entry.playerId??null,name:p.fullName||null,slot:entry.lineupSlotId,hasBoxScore:!!actual,minutesCandidate:actual?.stats?.['34']??null,statKeys:actual?Object.keys(actual.stats):[],playedCandidate:!!actual&&STARTER.has(entry.lineupSlotId)};
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=300');
 const period=Number(req.query.period||1),endOverride=req.query.through===undefined?null:Number(req.query.through);
 if(!Number.isInteger(period)||period<1||period>30||endOverride!==null&&(!Number.isInteger(endOverride)||endOverride<1||endOverride>250))return res.status(400).json({ok:false,error:'Invalid period'});
 try{
  const base=await espn('view=mSettings&view=mStatus&view=mSchedule');
  const periods=base.settings?.scheduleSettings?.matchupPeriods||{};
  const keys=Object.keys(periods).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const starts=Object.entries(periods).map(([id,v])=>({id:Number(id),start:Array.isArray(v)?Number(v[0]):NaN})).filter(x=>Number.isInteger(x.start)).sort((a,b)=>a.start-b.start);\n  const index=starts.findIndex(x=>x.id===period);\n  const start=index>=0?starts[index].start:null;\n  const nextStart=index>=0&&index+1<starts.length?starts[index+1].start:null;
  const current=Number(base.status?.currentScoringPeriod||base.scoringPeriodId||0);
  const through=endOverride??(current>0?current-1:0);
  if(start===null)return res.status(200).json({ok:true,verified:false,period,through,availablePeriodKeys:keys,reason:'ESPN did not expose scoring-period dates for this matchup; no totals published',teams:[]});
  const last=Math.min(through,nextStart===null?through:nextStart-1);\n  const completed=last>=start?Array.from({length:last-start+1},(_,i)=>start+i):[];
  if(completed.length>14)return res.status(400).json({ok:false,error:'Too many scoring days'});
  const fetched=await Promise.all(completed.map(async d=>({day:d,data:await espn('view=mRoster&scoringPeriodId='+d)})));
  const ids=new Set((base.teams||[]).map(t=>t.id));
  for(const f of fetched)for(const t of f.data.teams||[])ids.add(t.id);
  const teams=[...ids].sort((a,b)=>a-b).map(teamId=>{
   const events=fetched.flatMap(f=>(f.data.teams||[]).filter(t=>t.id===teamId).flatMap(t=>(t.roster?.entries||[]).map(e=>({...dayEvidence(e,f.day),day:f.day})).filter(x=>x.playedCandidate)));
   return {teamId,gamesUsedCandidate:Math.min(events.length,23),gamesRemainingCandidate:Math.max(0,23-events.length),rawEligibleAppearances:events.length,events};
  });
  return res.status(200).json({ok:true,verified:false,season:2027,period,weeklyCap:period===1?23:null,through,matchupStartScoringPeriod:start,nextMatchupStartScoringPeriod:nextStart,completedScoringPeriods:completed,refresh:'Automatic on request; CDN cache 30 minutes',note:'Candidate counts based on stat-line presence; verify zero-minute/DNP and lineup-lock behavior against ESPN before publication.',teams});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
}