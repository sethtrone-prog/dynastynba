// Read-only completed-game FPPG. Only finalized scoring days, active slots and played games.
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const ACTIVE=new Set([5,6,8,9,10,11]);
const calendar=require('./_matchup-calendar');
const {scoringDate,scoringPeriodForDate}=require('./_scoring-day');
async function espn(q){const r=await fetch(ROOT+'?'+q,{headers:{'User-Agent':'DynastyNBA completed FPPG beta'}});if(!r.ok)throw Error('ESPN '+r.status);return r.json();}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=10');
 const period=Number(req.query.period);
 if(!Number.isInteger(period)||period<1||period>30)return res.status(400).json({ok:false,error:'Invalid period'});
 const boundary=calendar.periodDays(period);
 if(!boundary)return res.status(400).json({ok:false,error:'Unknown period'});
 try{
  const last=Math.min(boundary.end,scoringPeriodForDate(scoringDate())-1);
  const days=last>=boundary.start?Array.from({length:last-boundary.start+1},(_,i)=>boundary.start+i):[];
  const data=await Promise.all(days.map(d=>espn('view=mRoster&scoringPeriodId='+d).then(x=>({day:d,teams:x.teams||[]}))));
  const totals=new Map();
  for(const {day,teams} of data)for(const team of teams){
   const result=totals.get(team.id)||{teamId:team.id,completedPoints:0,completedGames:0,unverifiedGames:0};
   for(const entry of team.roster?.entries||[]){
    if(!ACTIVE.has(Number(entry.lineupSlotId)))continue;
    const stats=(entry.playerPoolEntry?.player?.stats||[]).filter(s=>Number(s.scoringPeriodId)===day&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===5);
    const played=stats.find(s=>s.stats&&Number(s.stats['40'])>0);
    if(!played)continue;
    const scored=stats.find(s=>s.appliedTotal!=null&&Number.isFinite(Number(s.appliedTotal)));
    if(!scored){result.unverifiedGames++;continue;}
    result.completedGames++;
    result.completedPoints+=Number(scored.appliedTotal);
   }
   totals.set(team.id,result);
  }
  return res.status(200).json({ok:true,period,through:last,teams:[...totals.values()].map(t=>({...t,fppg:t.completedGames>0&&t.unverifiedGames===0?t.completedPoints/t.completedGames:null})),note:'Completed scoring days only. Missing fantasy-point values do not produce a misleading average. Includes eligible active appearances, including over-cap games.'});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};