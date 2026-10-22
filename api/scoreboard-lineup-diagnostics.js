// Diagnostic endpoint for the live games-used counter.
// Reports data availability, not personal roster data or speculative game counts.
const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=60');
 const day=Number(req.query.day||1);
 if(!Number.isInteger(day)||day<1||day>200)return res.status(400).json({ok:false,error:'Invalid scoring day'});
 try{
  const url=BASE+'?view=mRoster&view=mMatchupScore&view=mSettings&scoringPeriodId='+day;
  const r=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'DynastyNBA lineup diagnostics'},signal:AbortSignal.timeout(9000)});
  if(!r.ok)throw Error('ESPN HTTP '+r.status);
  const d=await r.json();
  const sample=(d.teams||[]).find(t=>t.roster?.entries?.length);
  const entry=sample?.roster?.entries?.[0];
  const player=entry?.playerPoolEntry?.player;
  const period=d.settings?.scheduleSettings?.matchupPeriods||{};
  res.json({ok:true,day,scoringPeriodId:d.scoringPeriodId||null,
   rosterTeams:(d.teams||[]).filter(t=>t.roster?.entries?.length).length,
   sampleRosterSize:sample?.roster?.entries?.length||0,
   entryFields:entry?Object.keys(entry):[],
   playerFields:player?Object.keys(player):[],
   lineupSlotId:entry?.lineupSlotId??null,
   playerProTeamId:player?.proTeamId??null,
   matchupPeriodKeys:Object.keys(period).slice(0,25),
   scheduleSettingsFields:Object.keys(d.settings?.scheduleSettings||{}),
   note:'Schema inspection only. Does not calculate or publish games-used totals.'});
 }catch(e){res.status(502).json({ok:false,error:'Lineup diagnostics unavailable',detail:String(e.message||e)})}
}