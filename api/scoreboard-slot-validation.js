const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
async function read(q){const r=await fetch(BASE+'?'+q,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('ESPN HTTP '+r.status);return r.json()}
const slotNames={0:'PG',1:'SG',2:'SF',3:'PF',4:'C',5:'G',6:'F',7:'SG/SF',8:'PF/C',9:'UTIL',10:'BE',11:'IR',12:'IR+',13:'BE',20:'BE',21:'IR',22:'IR+',23:'FLEX',24:'G-LEAGUE'};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 try{
  const d=await read('view=mRoster&view=mSettings&view=mTeam');
  const settings=d.settings?.rosterSettings||{};
  const declared=settings.lineupSlotCounts||{};
  const teams=(d.teams||[]).map(t=>{const entries=t.roster?.entries||[];return {id:t.id,name:t.name,entries:entries.length,slots:entries.reduce((a,e)=>{const id=String(e.lineupSlotId);a[id]=(a[id]||0)+1;return a},{}),missingPlayerIds:entries.filter(e=>!e.playerId&&!e.playerPoolEntry?.player?.id).length,missingNBAIds:entries.filter(e=>!Number.isFinite(Number(e.playerPoolEntry?.player?.proTeamId))).length}});
  const observed=[...new Set(teams.flatMap(t=>Object.keys(t.slots)))].sort((a,b)=>Number(a)-Number(b));
  const declaredIds=Object.keys(declared);
  const unknown=observed.filter(id=>!declaredIds.includes(id));
  const full=teams.length===10&&teams.every(t=>t.entries>0);
  res.json({ok:true,verified:full&&unknown.length===0,teamCount:teams.length,declaredSlotCounts:declared,observedSlotIds:observed,unknownSlotIds:unknown,slotNameHints:slotNames,teams,warning:'Slot names are hints only. Validate declared slots and ESPN lock behavior before publishing cumulative counts.'});
 }catch(e){res.status(502).json({ok:false,verified:false,error:'ESPN roster validation failed',detail:e.message})}
}