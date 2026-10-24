// Diagnostic only: roster membership is NOT proof of a game counting against the weekly cap.
const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE='76513288';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const season=2027, period=Number(req.query.period||1);
 if(!Number.isInteger(period)||period<1||period>30)return res.status(400).json({ok:false,error:'Invalid matchup period'});
 try{
  const url=BASE+'/seasons/'+season+'/segments/0/leagues/'+LEAGUE+'?view=mMatchupScore&view=mRoster&view=mSchedule&view=mSettings';
  const upstream=await fetch(url,{headers:{'User-Agent':'DynastyNBA scoreboard game-cap diagnostics'}});
  if(!upstream.ok)return res.status(502).json({ok:false,error:'ESPN unavailable',status:upstream.status});
  const data=await upstream.json();
  const matchups=(data.schedule||[]).filter(m=>Number(m.matchupPeriodId)===period);
  const teams=(data.teams||[]).map(t=>({teamId:t.id,name:t.name||[t.location,t.nickname].filter(Boolean).join(' '),rosterEntries:(t.roster?.entries||[]).map(e=>({playerId:e.playerPoolEntry?.player?.id??e.playerId??null,name:e.playerPoolEntry?.player?.fullName??null,lineupSlotId:e.lineupSlotId??null})),gamesUsed:null,gamesLive:null,gamesRemaining:null,verification:'not_verified'}));
  return res.status(200).json({ok:true,season,period,weeklyCap:period===1?23:null,verified:false,reason:'ESPN matchup roster entries do not establish historical lineup locks or eligible game usage. Counts deliberately withheld.',teamCount:teams.length,matchupCount:matchups.length,matchups:matchups.map(m=>({id:m.id,homeTeamId:m.home?.teamId,awayTeamId:m.away?.teamId,homePoints:m.home?.totalPoints??null,awayPoints:m.away?.totalPoints??null})),teams});
 }catch(e){return res.status(502).json({ok:false,error:'ESPN diagnostic request failed'});}
}
