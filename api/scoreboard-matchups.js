// Server-side ESPN matchup adapter for scoreboard beta.
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
module.exports=async function(req,res){
 res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=60');
 const period=Number(req.query.period||1);
 if(!Number.isInteger(period)||period<1||period>30)return res.status(400).json({ok:false,error:'Invalid period'});
 try{
 const r=await fetch(ROOT+'?view=mSchedule&view=mTeam&view=mStatus&view=mMatchupScore',{headers:{'User-Agent':'DynastyNBA scoreboard beta'}});
 if(!r.ok)throw Error('ESPN '+r.status);
 const d=await r.json();
 const matchups=(d.schedule||[]).filter(m=>Number(m.matchupPeriodId)===period).map(m=>({
 id:m.id,matchupPeriodId:m.matchupPeriodId,
 home:{teamId:m.home?.teamId,totalPoints:m.home?.totalPoints??null},
 away:{teamId:m.away?.teamId,totalPoints:m.away?.totalPoints??null}
 }));
 res.status(200).json({ok:true,period,teams:(d.teams||[]).map(t=>({id:t.id,name:t.name,location:t.location,nickname:t.nickname})),matchups});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};