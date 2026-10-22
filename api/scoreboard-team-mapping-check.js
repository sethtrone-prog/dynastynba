const FANTASY='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
async function read(u){const r=await fetch(u,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function etDate(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return p.year+p.month+p.day}
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');try{
 const [f,n]=await Promise.all([read(FANTASY+'?view=mRoster'),read(NBA+'?dates='+etDate())]);
 const nbaTeams=(n.events||[]).flatMap(e=>(e.competitions?.[0]?.competitors||[]).map(c=>({id:Number(c.team?.id),name:c.team?.displayName,abbreviation:c.team?.abbreviation,eventId:e.id})));
 const fantasyPlayers=(f.teams||[]).flatMap(t=>(t.roster?.entries||[]).map(e=>({playerId:e.playerId??e.playerPoolEntry?.player?.id,proTeamId:Number(e.playerPoolEntry?.player?.proTeamId),fullName:e.playerPoolEntry?.player?.fullName})));
 const ids=[...new Set(nbaTeams.map(t=>t.id))];const matched=ids.map(id=>({nbaTeam:nbaTeams.find(t=>t.id===id),fantasyPlayerCount:fantasyPlayers.filter(p=>p.proTeamId===id).length,samples:fantasyPlayers.filter(p=>p.proTeamId===id).slice(0,2)}));
 res.json({ok:true,verified:false,nbaGamesToday:(n.events||[]).length,nbaTeamsToday:ids.length,fantasyRosterPlayers:fantasyPlayers.length,comparison:matched,warning:'Matching numeric IDs is suggestive but not definitive. Independently validate a player-team association before enabling writes.'});
}catch(e){res.status(502).json({ok:false,error:e.message})}}