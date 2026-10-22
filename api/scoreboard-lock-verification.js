import {list,get} from '@vercel/blob';
const ESPN='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const ACTIVE=new Set([5,6,8,9,10,11]);
const ET=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
function etDate(d){const p=Object.fromEntries(ET.formatToParts(d).map(x=>[x.type,x.value]));return p.year+p.month+p.day}
async function fetchJSON(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('ESPN HTTP '+r.status);return r.json()}
async function blobs(prefix){let cursor,all=[],pages=0;do{const p=await list({prefix,limit:1000,cursor,token:process.env.BLOB_READ_WRITE_TOKEN});all.push(...p.blobs);cursor=p.hasMore?p.cursor:null;pages++}while(cursor&&pages<10);return {items:all,complete:!cursor}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({ok:false,error:'Storage unavailable'});
 const date=String(req.query.date||etDate(new Date()));
 if(!/^20\d{6}$/.test(date))return res.status(400).json({ok:false,error:'Expected YYYYMMDD date'});
 try{
  const [observations,locks,league]=await Promise.all([
   blobs('scoreboard-beta/observations/'+date+'/'),
   blobs('scoreboard-beta/locks/'+date+'/'),
   fetchJSON(ESPN+'?view=mRoster&view=mSettings&view=mStatus')
  ]);
  const sorted=observations.items.sort((a,b)=>new Date(a.uploadedAt)-new Date(b.uploadedAt));
  const first=sorted[0],last=sorted.at(-1);
  const load=async b=>{if(!b)return null;const result=await get(b.pathname,{access:'private',token:process.env.BLOB_READ_WRITE_TOKEN});return result?JSON.parse(await new Response(result.stream).text()):null};
  const [earliest,latest]=await Promise.all([load(first),load(last)]);
  const saved=await Promise.all(locks.items.slice(0,300).map(load));
  const nameData=await fetchJSON(ESPN+'?view=mTeam');
  const names=new Map((nameData.teams||[]).map(t=>[Number(t.id),t.name||[t.location,t.nickname].filter(Boolean).join(' ')||'Team '+t.id]));
  const byTeam=new Map();
  for(const t of league.teams||[])byTeam.set(Number(t.id),{teamId:Number(t.id),name:names.get(Number(t.id)),activeSnapshotPlayers:0,provisionalActive:0,provisionalBench:0,players:[]});
  for(const t of latest?.teams||[]){const row=byTeam.get(Number(t.teamId));if(row)row.activeSnapshotPlayers=t.players.filter(p=>ACTIVE.has(Number(p.slot))).length}
  for(const lock of saved){if(!lock)continue;const row=byTeam.get(Number(lock.fantasyTeamId));if(!row)continue;if(lock.eligible)row.provisionalActive++;else row.provisionalBench++;row.players.push({playerId:lock.playerId,gameId:lock.gameId,slot:lock.slot,eligible:lock.eligible,verified:false})}
  const games=(latest?.events||[]).map(g=>{const startMs=Date.parse(g.start);const observationMs=Date.parse(latest?.capturedAt);const hasTipoff=Number.isFinite(startMs)&&Number.isFinite(observationMs)&&observationMs>=startMs;const ids=new Set((g.teams||[]).map(t=>Number(t.nbaTeamId)));const candidates=[];for(const t of latest?.teams||[])for(const p of t.players||[]){if(!ids.has(Number(p.proTeamId)))continue;candidates.push({fantasyTeamId:t.teamId,playerId:p.playerId,slot:p.slot,active:ACTIVE.has(Number(p.slot))})}return {...g,hasScheduledTipoffPassed:hasTipoff,lockWindowState:!hasTipoff?'Before scheduled tipoff':g.state==='pre'?'Scheduled tipoff passed; ESPN still pregame':g.state==='in'||g.state==='post'?'Game started / finished':'Unknown game state',activeCandidateCount:candidates.filter(p=>p.active).length,benchCandidateCount:candidates.filter(p=>!p.active).length,candidates};});
  const warning=locks.items.length>300?'Showing only first 300 provisional records.':'';
  return res.json({ok:true,date,updatedAt:new Date().toISOString(),observations:{count:observations.items.length,first:first?.uploadedAt||null,last:last?.uploadedAt||null,complete:observations.complete},provisionalLocks:{count:locks.items.length,complete:locks.complete,shown:saved.length},teams:[...byTeam.values()],nbaGames:games.map(g=>({gameId:g.eventId,start:g.start,state:g.state,status:g.status,teams:g.teams,hasScheduledTipoffPassed:g.hasScheduledTipoffPassed,lockWindowState:g.lockWindowState,activeCandidateCount:g.activeCandidateCount,benchCandidateCount:g.benchCandidateCount,candidates:g.candidates})),earliestSnapshot:earliest?{capturedAt:earliest.capturedAt,teamCount:earliest.teams?.length}:null,latestSnapshot:latest?{capturedAt:latest.capturedAt,teamCount:latest.teams?.length}:null,verifiedGamesUsed:false,warning,note:'Provisional observations are not official ESPN lineup locks. Counts cannot be published until daily lineup and tipoff reconciliation passes.'});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message||e)})}
}