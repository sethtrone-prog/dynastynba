// Server-side ESPN matchup adapter for scoreboard beta.
const calendar=require('./_matchup-calendar');
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
module.exports=async function(req,res){
 res.setHeader('Cache-Control','public, s-maxage=15, stale-while-revalidate=10');
 const requested=req.query.period===undefined?null:Number(req.query.period);
 if(requested!==null&&(!Number.isInteger(requested)||requested<1||requested>30))return res.status(400).json({ok:false,error:'Invalid period'});
 try{
 const r=await fetch(ROOT+'?view=mSchedule&view=mTeam&view=mStatus&view=mMatchupScore',{headers:{'User-Agent':'DynastyNBA scoreboard beta'}});
 if(!r.ok)throw Error('ESPN '+r.status);
 const d=await r.json();
 const currentPeriod=calendar.currentMatchup();
 const period=requested??currentPeriod;
 const availablePeriods=[...new Set((d.schedule||[]).map(m=>Number(m.matchupPeriodId)).filter(Number.isInteger))].sort((a,b)=>a-b);
 const matchups=(d.schedule||[]).filter(m=>Number(m.matchupPeriodId)===period).map(m=>({
 id:m.id,matchupPeriodId:m.matchupPeriodId,
 home:{teamId:m.home?.teamId,totalPoints:m.home?.totalPointsLive??m.home?.totalPoints??null},
 away:{teamId:m.away?.teamId,totalPoints:m.away?.totalPointsLive??m.away?.totalPoints??null}
 }));
 res.status(200).json({ok:true,period,currentPeriod,availablePeriods,currentScoringPeriod:Number(d.status?.currentScoringPeriod||0),matchupDates:calendar.periodDays(period),teams:(d.teams||[]).map(t=>({id:t.id,name:t.name,location:t.location,nickname:t.nickname,record:{wins:t.record?.overall?.wins??0,losses:t.record?.overall?.losses??0,ties:t.record?.overall?.ties??0}})),matchups});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};