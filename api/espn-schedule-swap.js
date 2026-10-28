const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=120');
 const year=Number(req.query.season);
 if(!Number.isInteger(year)||year<2027||year>new Date().getUTCFullYear()+2)return res.status(400).json({ok:false,error:'Invalid season'});
 try{
  const response=await fetch(BASE+'/seasons/'+year+'/segments/0/leagues/76513288?view=mMatchupScore&view=mTeam',{headers:{'User-Agent':'DynastyNBA schedule swap'}});
  if(!response.ok)throw Error('ESPN unavailable');
  const data=await response.json(),teams=data.teams||[],schedule=data.schedule||[];
  const ids=teams.map(t=>Number(t.id)).filter(Number.isFinite);
  const periods=new Map();
  for(const m of schedule){
   if(!['HOME','AWAY','TIE'].includes(m.winner))continue;
   const week=Number(m.matchupPeriodId),h=Number(m.home?.teamId),a=Number(m.away?.teamId);
   const hp=Number(m.home?.totalPoints),ap=Number(m.away?.totalPoints);
   if(!Number.isFinite(week)||!ids.includes(h)||!ids.includes(a)||!Number.isFinite(hp)||!Number.isFinite(ap))continue;
   if(!periods.has(week))periods.set(week,new Map());
   const w=periods.get(week);
   w.set(h,{points:hp,opponent:a});w.set(a,{points:ap,opponent:h});
  }
  // Only fully completed matchup periods count: all teams must have a finalized score.
  const completed=[...periods.entries()].filter(([week,w])=>ids.every(id=>w.has(id))).sort((a,b)=>a[0]-b[0]);
  const matrix=ids.map(teamId=>({teamId,against:ids.map(scheduleTeamId=>{
   let wins=0,losses=0,ties=0;
   for(const [,w] of completed){
    const own=w.get(teamId),scheduled=w.get(scheduleTeamId);
    if(!own||!scheduled)continue;
    // When the substituted team would play itself, swap the schedule owner's original score into that opponent slot.
    if(scheduled.opponent===teamId)continue; // no self-matchup: exclude this week
    const opposingScore=w.get(scheduled.opponent)?.points;
    if(!Number.isFinite(opposingScore))continue;
    if(own.points>opposingScore)wins++;else if(own.points<opposingScore)losses++;else ties++;
   }
   return {scheduleTeamId,wins,losses,ties};
  })}));
  res.json({ok:true,season:year,weeks:completed.map(([week])=>week),teams:teams.map(t=>({id:Number(t.id),name:t.name})),matrix});
 }catch(e){res.status(502).json({ok:false,error:'Unable to verify completed ESPN matchup periods'});}
}