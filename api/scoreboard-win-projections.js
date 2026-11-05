// Beta: schedule-aware player FPPG projections for current and upcoming fantasy matchups.
const calendar=require('./_matchup-calendar');
const LEAGUE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
// ESPN eligible starting slots and bench (20); exclude IR and other reserve slots.
const ELIGIBLE=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,20]);
async function json(url,options){const r=await fetch(url,options);if(!r.ok)throw Error('ESPN '+r.status);return r.json();}
function dateList(from,to){const a=[];for(let t=Date.parse(from+'T00:00:00Z');t<=Date.parse(to+'T00:00:00Z');t+=86400000)a.push(new Date(t).toISOString().slice(0,10).replace(/-/g,''));return a;}
function availability(status){
 const s=String(status||'ACTIVE').toUpperCase().replace(/[ -]/g,'_');
 // Long-term absence has zero projected games. Short-term statuses remain
 // probabilistic; unknown statuses are treated as available.
 if(['INJURY_RESERVE','IR','OUT','SUSPENSION','SUSPENDED','O'].includes(s))return 0;
 if(['DOUBTFUL','D'].includes(s))return .2;
 if(['QUESTIONABLE','Q','DAY_TO_DAY','DTD'].includes(s))return .75;
 return 1;
}
module.exports=async function(req,res){
 res.setHeader('Cache-Control','public, s-maxage=90, stale-while-revalidate=30');
 const period=Number(req.query.period||calendar.currentMatchup());
 const days=calendar.periodDays(period);
 if(!days)return res.status(400).json({ok:false,error:'Invalid period'});
 if(period<calendar.currentMatchup())return res.status(200).json({ok:false,reason:'Historical matchups do not use future roster projections'});
 try{
  const today=calendar.easternDate();
  const dates=dateList(today>days.startDate?today:days.startDate,days.endDate);
  const [league,stats,...boards]=await Promise.all([
   json(LEAGUE+'?view=mRoster&view=mStatus'),
   json(LEAGUE+'?view=kona_player_info&view=kona_playercard&view=mTeam',{headers:{'x-fantasy-filter':JSON.stringify({players:{limit:2000,sortPercOwned:{sortPriority:1,sortAsc:false}}})}}),
   ...dates.map(date=>json(NBA+'?dates='+date))
  ]);
  const playerStats=new Map((stats.players||[]).map(e=>{
   const p=e.player||{};
   const st=(p.stats||[]).find(s=>Number(s.seasonId)===2027&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===0);
   return [String(p.id),{fppg:Number(st?.appliedAverage),gp:Number(st?.stats?.['42']||0),injuryStatus:p.injuryStatus||p.injury?.status||null}];
  }));
  const scheduled=new Map();
  for(const board of boards)for(const event of board.events||[]){
   const status=event.status?.type?.name||'';
   if(!['STATUS_SCHEDULED','STATUS_TIME_TBD','STATUS_DELAYED'].includes(status))continue;
   for(const c of event.competitions?.[0]?.competitors||[]){
    const id=Number(c.team?.id);
    if(Number.isFinite(id))scheduled.set(id,(scheduled.get(id)||0)+1);
   }
  }
  const teams=(league.teams||[]).map(t=>({
   teamId:t.id,
   players:(t.roster?.entries||[]).filter(e=>ELIGIBLE.has(Number(e.lineupSlotId))).map(e=>{
    const p=e.playerPoolEntry?.player||{},stat=playerStats.get(String(p.id))||{};
    const injuryStatus=p.injuryStatus||p.injury?.status||stat.injuryStatus||'ACTIVE';
    const games=scheduled.get(Number(p.proTeamId))||0;
    const fppg=Number.isFinite(stat.fppg)&&stat.gp>0?stat.fppg:null;
    return {playerId:p.id,name:p.fullName,proTeamId:p.proTeamId,lineupSlotId:e.lineupSlotId,injuryStatus,availability:availability(injuryStatus),scheduledGames:games,fppg,projectedPoints:fppg===null?null:fppg*games*availability(injuryStatus)};
   })
  }));
  return res.status(200).json({ok:true,period,throughDate:today,endDate:days.endDate,method:'ESPN eligible starters and bench, current-season FPPG, remaining NBA team schedule, injury availability',teams});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};
