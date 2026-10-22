// Experimental locked-lineup game usage, based on historical ESPN daily roster views.
// Never substitute current roster for historical lineup data.
const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13]);
async function json(url){const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'DynastyNBA live games usage'},signal:AbortSignal.timeout(8500)});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function ymd(d){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d).replace(/(\d\d)\/(\d\d)\/(\d{4})/,'$3$1$2').replace(/-/g,'')}
function parseDate(s){const d=new Date(s);return Number.isFinite(d.getTime())?d:null}
function nbaIds(event){return (event.competitions?.[0]?.competitors||[]).map(c=>Number(c.team?.id)).filter(Number.isFinite)}
async function run(period){
 const settings=await json(BASE+'?view=mSettings&view=mMatchupScore');
 const schedule=settings.settings?.scheduleSettings||{};
 const periods=schedule.matchupPeriods||{};
 const dayIds=Object.entries(periods).filter(([k])=>Number(k)===period).flatMap(([,v])=>Array.isArray(v)?v:[]);
 if(!dayIds.length)return {ok:false,reason:'No daily scoring periods returned for this matchup',period,periodKeys:Object.keys(periods)};
 const days=dayIds.slice(0,10);
 const counts=new Map(),issues=[];
 const daily=await Promise.all(days.map(async day=>{
  try{
   const data=await json(BASE+'?view=mRoster&scoringPeriodId='+day);
   const dateString=data.status?.currentMatchupPeriod||'';
   const scoringDate=data.settings?.scheduleSettings?.matchupPeriods?null:null;
   const rosterTeams=(data.teams||[]).filter(t=>Array.isArray(t.roster?.entries));
   return {day,rosterTeams,hasRoster:rosterTeams.length>0,dateString,scoringDate};
  }catch(e){issues.push('Day '+day+': '+e.message);return {day,rosterTeams:[],hasRoster:false}}
 }));
 return {ok:true,period,dayIds,daysInspected:daily.map(d=>({day:d.day,teams:d.rosterTeams.length,firstTeamSlots:d.rosterTeams[0]?.roster?.entries?.slice(0,3).map(e=>({slot:e.lineupSlotId,playerId:e.playerId,proTeamId:e.playerPoolEntry?.player?.proTeamId}))||[]})),issues,verified:false,reason:'Requires NBA date-to-scoringPeriodId mapping and lineup slot verification before publishing counts'};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=120');
 const period=Number(req.query.period||1);
 if(!Number.isInteger(period)||period<1||period>20)return res.status(400).json({ok:false,error:'Invalid period'});
 try{res.json(await run(period))}catch(e){res.status(502).json({ok:false,error:'Lineup inspection failed',detail:e.message})}
}