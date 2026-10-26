// Beta-only active-lineup player detail feed. Does not modify official scoring or GP.
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([5,6,8,9,10,11]);
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'DynastyNBA active-lineup beta'}});if(!r.ok)throw Error('Upstream '+r.status);return r.json();}
function playerPoints(p,day){const stats=(p.stats||[]).filter(s=>Number(s.scoringPeriodId)===day&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===5);const match=stats.find(s=>s.appliedTotal!==null&&s.appliedTotal!==undefined&&Number.isFinite(Number(s.appliedTotal)));return match?{points:Number(match.appliedTotal),verified:true}: {points:null,verified:false};}\nfunction nyDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replace(/-/g,'');}
function gameStatus(event){const s=event?.status?.type||{};if(s.completed||s.name==='STATUS_FINAL')return 'FINAL';if(['STATUS_SCHEDULED','STATUS_TIME_TBD'].includes(s.name))return 'UPCOMING';if(['STATUS_POSTPONED','STATUS_CANCELED','STATUS_DELAYED'].includes(s.name))return 'UNAVAILABLE';return s.name?'LIVE':'UNKNOWN';}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','private, no-store');
 const period=Number(req.query.period||1),date=String(req.query.date||nyDate());
 if(!Number.isInteger(period)||period<1||period>30||!/^\d{8}$/.test(date))return res.status(400).json({ok:false,error:'Invalid period or date'});
 try{
  const [base,board]=await Promise.all([get(ROOT+'?view=mStatus&view=mSchedule&view=mTeam'),get(NBA+'?dates='+date)]);
  const scoringPeriodId=Number(req.query.scoringPeriodId||base.status?.currentScoringPeriod||base.scoringPeriodId);
  if(!Number.isInteger(scoringPeriodId)||scoringPeriodId<1||scoringPeriodId>250)return res.status(502).json({ok:false,error:'ESPN scoring period unavailable'});
  const roster=await get(ROOT+'?view=mRoster&scoringPeriodId='+scoringPeriodId);
  const games=new Map();
  for(const event of board.events||[])for(const c of event.competitions?.[0]?.competitors||[])games.set(Number(c.team?.id),{eventId:String(event.id),status:gameStatus(event),tipoff:event.date||null,detail:event.status?.type?.shortDetail||null});
  const teams=(roster.teams||[]).map(t=>({teamId:t.id,players:(t.roster?.entries||[]).filter(e=>ACTIVE.has(Number(e.lineupSlotId))).map(e=>{
   const p=e.playerPoolEntry?.player||{},game=games.get(Number(p.proTeamId)),scoring=playerPoints(p,scoringPeriodId);
   return {playerId:p.id??e.playerId??null,name:p.fullName||null,proTeamId:p.proTeamId??null,lineupSlotId:e.lineupSlotId,gameStatus:game?.status||'NO_GAME',nbaEventId:game?.eventId||null,tipoff:game?.tipoff||null,gameDetail:game?.detail||null,fantasyPoints:scoring.points,pointsVerified:scoring.verified,lineupAtTipoffVerified:false};
  }).filter(p=>p.gameStatus!=='NO_GAME')}));
  const matchups=(base.schedule||[]).filter(m=>Number(m.matchupPeriodId)===period).map(m=>({matchupId:m.id,homeTeamId:m.home?.teamId??null,awayTeamId:m.away?.teamId??null}));
  res.status(200).json({ok:true,beta:true,season:2027,period,date,scoringPeriodId,generatedAt:new Date().toISOString(),source:'ESPN daily fantasy mRoster + NBA scoreboard',lineupSource:'ESPN scoring-period roster; tipoff lock unverified',fantasyPointsAvailable:true,note:'Individual points use ESPN player stats appliedTotal for the selected scoring day (statSourceId 0, statSplitTypeId 5). Missing values remain null; values are provisional until validated against league scoring. Historical lineup lock is not asserted.',matchups,teams});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};