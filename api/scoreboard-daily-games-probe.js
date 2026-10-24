// Beta-only daily games-used probe. Never publishes unverified totals.
const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const ACTIVE=new Set([0,1,2,3,4,5,6,7,8,9,10,11]);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const start=Number(req.query.start||1),end=Number(req.query.end||start);
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>250||end<start||end-start>13)return res.status(400).json({ok:false,error:'Use start/end scoring periods, maximum 14 days'});
 try{
  const days=await Promise.all(Array.from({length:end-start+1},(_,i)=>start+i).map(async scoringPeriod=>{
   const u=BASE+'?view=mRoster&view=mSettings&scoringPeriodId='+scoringPeriod;
   const r=await fetch(u,{headers:{'User-Agent':'DynastyNBA game usage beta probe'}});
   if(!r.ok)throw Error('ESPN HTTP '+r.status+' on period '+scoringPeriod);
   const d=await r.json();
   return {scoringPeriod,teams:(d.teams||[]).map(t=>({teamId:t.id,players:(t.roster?.entries||[]).map(e=>{
    const p=e.playerPoolEntry?.player||{},stats=p.stats||[];
    return {playerId:p.id??e.playerId??null,name:p.fullName??null,slot:e.lineupSlotId??null,active:ACTIVE.has(e.lineupSlotId),appliedStatTotal:e.playerPoolEntry?.appliedStatTotal??null,statEvidence:stats.filter(s=>Number(s.scoringPeriodId)===scoringPeriod).map(s=>({statSourceId:s.statSourceId,statSplitTypeId:s.statSplitTypeId,scoringPeriodId:s.scoringPeriodId,appliedTotal:s.appliedTotal,statKeys:Object.keys(s.stats||{}),gamesPlayedStat:s.stats?.['0']??null}))};
   })}))};
  }));
  return res.status(200).json({ok:true,verified:false,note:'Diagnostic: stat key 0 and daily participation semantics must be validated before game counts are calculated.',start,end,days});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
}