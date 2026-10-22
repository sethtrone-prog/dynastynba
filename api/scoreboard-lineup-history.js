// Inspect ESPN fantasy basketball's day-specific lineup endpoints.
// Daily scoringPeriodId is distinct from weekly matchupPeriodId.
const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
async function get(params){const r=await fetch(BASE+'?'+params,{headers:{Accept:'application/json','User-Agent':'DynastyNBA lineup verification'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('ESPN HTTP '+r.status);return r.json()}
const slots=entries=>(entries||[]).reduce((a,e)=>{const id=e.lineupSlotId;a[id]=(a[id]||0)+1;return a},{});
const boxEntries=(m,s)=>m?.[s]?.rosterForCurrentScoringPeriod?.entries||[];
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=90');
 const period=Number(req.query.period||1);
 if(!Number.isInteger(period)||period<1||period>20)return res.status(400).json({ok:false,error:'Invalid matchup period'});
 try{
  const config=await get('view=mSettings&view=mStatus');
  const mapping=config.settings?.scheduleSettings?.matchupPeriods||{};
  const raw=mapping[String(period)];
  const days=Array.isArray(raw)?raw.map(Number).filter(Number.isInteger):[];
  if(!days.length)return res.json({ok:false,verified:false,period,reason:'ESPN settings do not provide daily scoring period mapping for this matchup',matchupPeriodsSample:Object.entries(mapping).slice(0,4),scheduleKeys:Object.keys(config.settings?.scheduleSettings||{}),currentScoringPeriod:config.scoringPeriodId??null});
  const samples=[days[0],days[Math.min(1,days.length-1)],days[days.length-1]].filter((v,i,a)=>a.indexOf(v)===i);
  const results=[];
  for(const day of samples){
   const item={day};
   for(const view of ['mRoster','mBoxscore']){
    try{
     const d=await get('view='+view+'&matchupPeriodId='+period+'&scoringPeriodId='+day);
     const rosterTeams=(d.teams||[]).filter(t=>Array.isArray(t.roster?.entries));
     const matchups=(d.schedule||[]).filter(m=>Number(m.matchupPeriodId)===period);
     const sides=matchups.flatMap(m=>['home','away'].map(side=>({teamId:m[side]?.teamId,entries:boxEntries(m,side)}))).filter(s=>s.entries.length);
     const examples=(view==='mRoster'?rosterTeams.map(t=>({teamId:t.id,entries:t.roster.entries})):sides).slice(0,2);
     item[view]={rosterTeams:rosterTeams.length,matchupSides:sides.length,examples:examples.map(t=>({teamId:t.teamId??t.id,entries:t.entries.length,slots:slots(t.entries),samplePlayers:t.entries.slice(0,2).map(e=>({playerId:e.playerId,slot:e.lineupSlotId,proTeamId:e.playerPoolEntry?.player?.proTeamId??null}))}))};
    }catch(e){item[view]={error:e.message}}
   }
   results.push(item)
  }
  const hasLineups=results.some(x=>x.mBoxscore?.matchupSides>0||x.mRoster?.rosterTeams>0);
  res.json({ok:true,verified:false,period,dayIds:days,daysInspected:results.map(x=>({day:x.day,teams:x.mRoster?.rosterTeams||0,firstTeamSlots:x.mRoster?.examples?.[0]?.samplePlayers||[]})),details:results,hasHistoricalRosterData:hasLineups,reason:hasLineups?'ESPN daily lineup data found. Compare past-day entries with locked ESPN lineups before enabling live counts.':'ESPN returned no day-specific lineup entries in the tested views.'});
 }catch(e){res.status(502).json({ok:false,verified:false,error:'ESPN lineup inspection failed',detail:e.message})}
}