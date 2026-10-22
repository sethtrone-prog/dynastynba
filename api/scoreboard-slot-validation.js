const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
async function read(q){const r=await fetch(BASE+'?'+q,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('ESPN HTTP '+r.status);return r.json()}
const slotNames={5:'Active scoring slot',6:'Active scoring slot',8:'Active scoring slot',9:'Active scoring slot',10:'Active scoring slot',11:'Active scoring slot',12:'Bench',13:'Injured reserve'};
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
  const activeSlotIds=Object.entries(declared).filter(([id,n])=>Number(n)>0&&Number(id)!==12&&Number(id)!==13).map(([id])=>Number(id));
  const activeSlotCount=activeSlotIds.reduce((sum,id)=>sum+Number(declared[id]||0),0);
  const configMatches=activeSlotCount===9&&Number(declared[12])===15&&Number(declared[13])===2;
  res.json({ok:true,verified:full&&unknown.length===0&&configMatches,activeSlotIds,activeSlotCount,benchSlotId:12,injuredReserveSlotId:13,teamCount:teams.length,declaredSlotCounts:declared,observedSlotIds:observed,unknownSlotIds:unknown,slotNameHints:slotNames,teams,warning:'League slot configuration is validated; historical day-specific lineups and at-lock roster behavior still require separate verification.'});
 }catch(e){res.status(502).json({ok:false,verified:false,error:'ESPN roster validation failed',detail:e.message})}
}