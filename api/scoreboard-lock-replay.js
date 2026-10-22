const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([5,6,8,9,10,11]);
const ANCHOR='20261020'; // Provisional calendar anchor; ESPN scoring period can be independently requested.
async function json(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Upstream HTTP '+r.status);return r.json()}
function etDate(d){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).map(x=>[x.type,x.value]));return p.year+p.month+p.day}
function epoch(s){return Date.UTC(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8))}
function fromEpoch(n){return new Date(n).toISOString().slice(0,10).replaceAll('-','')}
function mappedDay(date){return Math.round((epoch(date)-epoch(ANCHOR))/86400000)+1}
function teamsFromBox(box,period,names){const result=new Map();for(const m of box.schedule||[]){if(Number(m.matchupPeriodId)!==period)continue;for(const side of ['home','away']){const t=m[side];if(!t||!Array.isArray(t.rosterForCurrentScoringPeriod?.entries))continue;result.set(Number(t.teamId),{teamId:Number(t.teamId),name:names.get(Number(t.teamId))||'Team '+t.teamId,players:t.rosterForCurrentScoringPeriod.entries.map(e=>({playerId:e.playerId??e.playerPoolEntry?.player?.id,slot:Number(e.lineupSlotId),proTeamId:e.playerPoolEntry?.player?.proTeamId??null,name:e.playerPoolEntry?.player?.fullName||null})).filter(p=>p.playerId!=null)})}}return result}
function gamesFromNba(nba){return (nba.events||[]).map(e=>({gameId:String(e.id),start:e.date,state:e.status?.type?.state,status:e.status?.type?.name,nbaTeams:(e.competitions?.[0]?.competitors||[]).map(c=>({id:Number(c.team?.id),name:c.team?.displayName}))}))}
function evaluate(lineups,games){const result=[];const keys=new Set();let duplicates=0;for(const t of lineups.values()){const players=[];for(const p of t.players){const matching=games.filter(g=>g.nbaTeams.some(x=>x.id===Number(p.proTeamId)));for(const game of matching){const key=t.teamId+':'+p.playerId+':'+game.gameId;if(keys.has(key)){duplicates++;continue}keys.add(key);players.push({...p,gameId:game.gameId,active:ACTIVE.has(p.slot),candidate:ACTIVE.has(p.slot),gameState:game.state})}}result.push({teamId:t.teamId,name:t.name,activeGameCandidates:players.filter(p=>p.candidate).length,benchGameCandidates:players.filter(p=>!p.candidate).length,players})}return {teams:result,duplicateKeysPrevented:duplicates,uniquePlayerGameKeys:keys.size}}
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');
 const date=String(req.query.date||etDate(new Date(Date.now()-86400000)));
 const period=Number(req.query.period||1),weekly=req.query.weekly==='1';
 if(!/^20\d{6}$/.test(date)||!Number.isInteger(period)||period<1||period>30)return res.status(400).json({ok:false,error:'Invalid date or matchup period'});
 try{
 const settings=await json(BASE+'?view=mSettings&view=mStatus&view=mTeam');
 const mapping=settings.settings?.scheduleSettings?.matchupPeriods||{};
 const periodDays=(mapping[String(period)]||[]).map(Number).filter(Number.isInteger);
 const inferredDay=mappedDay(date);
 const day=Number(req.query.day||inferredDay);
 const explicitDay=req.query.day!=null;
 if(!Number.isInteger(day)||day<1||day>200 )return res.status(422).json({ok:false,error:'Invalid scoring day',date,mappedScoringDay:day,periodDays,calendarAnchor:ANCHOR});
 const mappingWarning=!periodDays.includes(day)?'Scoring day is not listed in ESPN matchup-period settings; replay results are provisional.':null;
 const names=new Map((settings.teams||[]).map(t=>[Number(t.id),t.name||'Team '+t.id]));
 const checkDays=weekly?Array.from({length:Math.min(day,14)},(_,i)=>day-Math.min(day,14)+i+1):[day];
 const dates=checkDays.map(n=>({day:n,date:fromEpoch(epoch(ANCHOR)+(n-1)*86400000)}));
 const reads=await Promise.all(dates.map(async x=>{const [box,nba]=await Promise.all([json(BASE+'?view=mBoxscore&matchupPeriodId='+period+'&scoringPeriodId='+x.day),json(NBA+'?dates='+x.date)]);const lineups=teamsFromBox(box,period,names),games=gamesFromNba(nba),evald=evaluate(lineups,games);return {...x,teamCount:lineups.size,nbaGames:games,teams:evald.teams,duplicateKeysPrevented:evald.duplicateKeysPrevented,uniquePlayerGameKeys:evald.uniquePlayerGameKeys}}));
 const totals=new Map([...names].map(([teamId,name])=>[teamId,{teamId,name,activeGameCandidates:0,benchGameCandidates:0,players:[]}]));
 const dedupe=new Set();let prevented=0;for(const read of reads){prevented+=read.duplicateKeysPrevented;for(const team of read.teams){if(!totals.has(team.teamId))totals.set(team.teamId,{teamId:team.teamId,name:team.name,activeGameCandidates:0,benchGameCandidates:0,players:[]});const row=totals.get(team.teamId);for(const p of team.players){const key=team.teamId+':'+p.playerId+':'+p.gameId;if(dedupe.has(key)){prevented++;continue}dedupe.add(key);row.players.push({...p,date:read.date,scoringDay:read.day});if(p.candidate)row.activeGameCandidates++;else row.benchGameCandidates++}}}
 const teams=[...totals.values()];
 return res.json({ok:true,date,matchupPeriodId:period,scoringPeriodId:day,calendarMapping:{anchorDate:ANCHOR,method:explicitDay?'Explicit scoring day override':'Provisional NBA opening-day anchor + elapsed calendar days',verifiedAgainstESPN:false,periodDays,mappingWarning},weekly,daysChecked:reads.map(x=>({date:x.date,scoringDay:x.day,teamCount:x.teamCount,nbaGames:x.nbaGames.length,activeCandidates:x.teams.reduce((n,t)=>n+t.activeGameCandidates,0),benchCandidates:x.teams.reduce((n,t)=>n+t.benchGameCandidates,0)})),espnDailyLineupTeams:reads.at(-1)?.teamCount||0,nbaGames:reads.at(-1)?.nbaGames||[],teams,summary:{activeCandidates:teams.reduce((n,t)=>n+t.activeGameCandidates,0),benchCandidates:teams.reduce((n,t)=>n+t.benchGameCandidates,0),allTenTeams:reads.every(x=>x.teamCount===10),daysProcessed:reads.length,uniquePlayerGameKeys:dedupe.size,duplicatesPrevented:prevented},verified:false,interpretation:'Candidate counts only. ESPN daily boxscore lineup assignments and provisional calendar anchor have not been independently confirmed as tipoff-frozen. No official Games Used totals are published.'});
 }catch(e){res.status(502).json({ok:false,error:String(e.message||e)})}
}