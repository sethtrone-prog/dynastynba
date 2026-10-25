// Shared Week 1 games-played ledger. Candidate evidence is provisional until ESPN
// daily roster statistics independently confirm it. Never caps counts at 23.
const {list,put}=require('@vercel/blob');
const finalized=require('./scoreboard-games-used');
const live=require('./scoreboard-tipoff-tracker');
const matchups=require('./scoreboard-matchups');
const PREFIX='scoreboard-gp/2027/week1/';
function invoke(handler,query={}){
 return new Promise((resolve,reject)=>{
  const res={statusCode:200,setHeader(){return this},status(n){this.statusCode=n;return this},json(body){resolve(body);return this}};
  Promise.resolve(handler({query},res)).catch(reject);
 });
}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 try{
  const [g,l,s]=await Promise.all([invoke(finalized,{period:1}),invoke(live,{}),invoke(matchups,{period:1})]);
  if(!g.ok||!l.ok||!s.ok)throw Error('ESPN source unavailable');
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error('Shared GP storage is not configured');
  const completed=new Set(g.completedScoringPeriods||[]);
  const current=Number(l.scoringPeriodId);
  if(!Number.isInteger(current)||current<1)throw Error('Current ESPN scoring period unavailable');
  const existing=new Set();let cursor;
  do{
   const page=await list({prefix:PREFIX,limit:1000,...(cursor?{cursor}:{})});
   for(const item of page.blobs||[])existing.add(item.pathname);
   cursor=page.hasMore?page.cursor:null;
  }while(cursor);
  const newEvidence=[];
  for(const team of l.teams||[])for(const player of team.candidates||[]){
   if(!player.liveAppearanceCandidate||!player.identityMatch||!player.nbaGameStarted||!player.playerId)continue;
   const path=PREFIX+current+'/'+team.teamId+'/'+player.playerId+'.json';
   if(!existing.has(path)){newEvidence.push({path,teamId:team.teamId,playerId:player.playerId,scoringPeriodId:current,eventId:player.eventId,observedAt:new Date().toISOString()});existing.add(path)}
  }
  await Promise.all(newEvidence.map(e=>put(e.path,JSON.stringify(e),{access:'public',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json'}).catch(err=>{if(!/already exists|conflict|409/i.test(String(err)))throw err})));
  const pending=new Map();
  for(const path of existing){
   const m=path.match(/^scoreboard-gp\/2027\/week1\/(\d+)\/(\d+)\/(\d+)\.json$/);
   if(!m||completed.has(Number(m[1])))continue;
   const teamId=Number(m[2]);pending.set(teamId,(pending.get(teamId)||0)+1);
  }
  const totals=(g.teams||[]).map(t=>({teamId:t.teamId,finalized:t.gamesUsedCandidate||0,provisional:pending.get(t.teamId)||0,gamesUsed:(t.gamesUsedCandidate||0)+(pending.get(t.teamId)||0)}));
  res.status(200).json({ok:true,verified:false,period:1,weeklyCap:23,completedScoringPeriods:[...completed],scoringPeriodId:current,teams:totals,g,s,l,storage:'Vercel Blob',note:'Provisional individual appearances persist across sessions and devices. Once a scoring period is finalized, ESPN roster evidence replaces provisional entries without double counting.'});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,240)})}
};
