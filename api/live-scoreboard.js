const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=30');
 const period=Number(req.query.period||0);
 if(!Number.isInteger(period)||period<0||period>20)return res.status(400).json({ok:false,error:'Invalid period'});
 try{
  const url=BASE+'?view=mMatchupScore&view=mScoreboard&view=mSettings&view=mTeam'+(period?'&scoringPeriodId='+period:'');
  const response=await fetch(url,{headers:{'User-Agent':'DynastyNBA scoreboard','Accept':'application/json'},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw new Error('ESPN HTTP '+response.status);
  const d=await response.json();
  const teams=new Map((d.teams||[]).map(t=>[Number(t.id),{id:t.id,name:t.name||('Team '+t.id),logo:t.logo||''}]));
  const matchups=(d.schedule||[]).filter(m=>!period||Number(m.matchupPeriodId)===period).map(m=>{
   const side=s=>{if(!s)return null;const team=teams.get(Number(s.teamId))||{id:s.teamId,name:'Team '+s.teamId};
    const score=typeof s.totalPoints==='number'?s.totalPoints:null;
    const used=Number.isFinite(s.gamesPlayed)?s.gamesPlayed:null;
    return {...team,score,gamesUsed:used};
   };
   return {id:m.id,period:m.matchupPeriodId,home:side(m.home),away:side(m.away),winner:m.winner||null};
  }).filter(m=>m.home&&m.away);
  const current=Number(d.scoringPeriodId)||null;
  const active=period||current||Number(matchups[0]?.period)||1;
  res.status(200).json({ok:true,period:active,currentPeriod:current,updatedAt:new Date().toISOString(),matchups:matchups.filter(m=>Number(m.period)===active),gameLimit:null,notes:'Games used is displayed only when ESPN explicitly supplies a counted-games field. No inferred counts.'});
 }catch(e){res.status(502).json({ok:false,error:'ESPN scoreboard unavailable',detail:String(e.message||e)});}
}