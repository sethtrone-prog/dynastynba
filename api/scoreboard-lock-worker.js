import {put} from '@vercel/blob';
const ESPN='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ACTIVE=new Set([5,6,8,9,10,11]);
const BENCH=new Set([12,13]);
async function get(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('Upstream HTTP '+r.status);return r.json()}
function dateET(now){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));return p.year+p.month+p.day}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 console.info('scoreboard-lock-worker invoked',new Date().toISOString());
 if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({ok:false,error:'Blob token missing'});
 if(!process.env.CRON_SECRET)return res.status(503).json({ok:false,error:'CRON_SECRET missing'});
 if(req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)return res.status(401).json({ok:false,error:'Unauthorized'});
 try{
  const now=new Date(),date=dateET(now);
  const [league,nba]=await Promise.all([get(ESPN+'?view=mRoster&view=mSettings&view=mStatus'),get(NBA+'?dates='+date)]);
  const declared=league.settings?.rosterSettings?.lineupSlotCounts||{};
  const teams=(league.teams||[]).map(t=>({teamId:t.id,players:(t.roster?.entries||[]).map(e=>({playerId:e.playerId??e.playerPoolEntry?.player?.id,slot:Number(e.lineupSlotId),proTeamId:e.playerPoolEntry?.player?.proTeamId??null,active:ACTIVE.has(Number(e.lineupSlotId))}))}));
  if(teams.length!==10||teams.some(t=>!t.players.length)||Number(declared[12])!==15||Number(declared[13])!==2)return res.status(409).json({ok:false,error:'Roster configuration mismatch; snapshot not saved',teamCount:teams.length});
  const events=(nba.events||[]).map(e=>({eventId:String(e.id),start:e.date,state:e.status?.type?.state,status:e.status?.type?.name,teams:(e.competitions?.[0]?.competitors||[]).map(c=>({nbaTeamId:Number(c.team?.id),name:c.team?.displayName}))}));
  const minute=now.toISOString().slice(0,16).replace(/[:T]/g,'-');
  const record={kind:'observation-not-lock',capturedAt:now.toISOString(),dateET:date,scoringPeriodId:league.scoringPeriodId,teams,events,warning:'Snapshots are NOT authoritative player locks; ESPN fantasy proTeamId to NBA scoreboard team ID mapping and actual game-lock timing require validation.'};
  const path='scoreboard-beta/observations/'+date+'/'+minute+'.json';
  const saved=await put(path,JSON.stringify(record),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:true});
  // Persist provisional lock candidates only within a strict tipoff window. A candidate is
  // never counted until confirmed against ESPN's finalized daily roster.
  const candidates=[];
  for(const game of events){
   const delta=now.getTime()-new Date(game.start).getTime();
   if(!Number.isFinite(delta)||delta<0||delta>900000||game.state==='pre'||game.status==='STATUS_POSTPONED')continue;
   const ids=new Set(game.teams.map(t=>t.nbaTeamId));
   for(const team of teams)for(const player of team.players){
    if(!ACTIVE.has(player.slot)&&!BENCH.has(player.slot))continue;
    if(!ids.has(Number(player.proTeamId))||!Number.isInteger(Number(player.playerId)))continue;
    candidates.push({kind:'provisional-lock',leagueId:76513288,season:2027,scoringPeriodId:league.scoringPeriodId,gameId:game.eventId,scheduledTipoff:game.start,observedAt:now.toISOString(),fantasyTeamId:team.teamId,playerId:player.playerId,proTeamId:player.proTeamId,slot:player.slot,eligible:ACTIVE.has(player.slot),verified:false});
   }
  }
  let created=0,alreadyExists=0,failures=0;
  for(const item of candidates){
   const key='scoreboard-beta/locks/'+date+'/'+item.gameId+'/'+item.fantasyTeamId+'-'+item.playerId+'.json';
   try{await put(key,JSON.stringify(item),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:false});created++}
   catch(e){if(e?.code==='blob_already_exists'||e?.name==='BlobAlreadyExistsError'||/already exists/i.test(e.message||''))alreadyExists++;else failures++}
  }
  res.json({ok:failures===0,snapshotSaved:true,pathname:saved.pathname,teamCount:teams.length,events:events.length,activePlayers:teams.reduce((n,t)=>n+t.players.filter(p=>p.active).length,0),lockCandidates:candidates.length,created,alreadyExists,failures,publishedGameCounts:false,reason:'Provisional lock records are durable and deduplicated by game, team, and player. No official count until reconciliation.'});
 }catch(e){res.status(502).json({ok:false,error:e.message})}
}