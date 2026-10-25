// Compare independent ESPN daily roster and matchup boxscore evidence, for all ten teams.
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const ACTIVE=new Set([5,6,8,9,10,11]);
async function get(query){const r=await fetch(ROOT+'?'+query);if(!r.ok)throw Error('ESPN '+r.status);return r.json();}
function evidence(e,day){const p=e.playerPoolEntry?.player||{};const stat=(p.stats||[]).find(s=>Number(s.scoringPeriodId)===day&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===5);return {id:Number(e.playerId??p.id),slot:Number(e.lineupSlotId),minutes:Number(stat?.stats?.['40']||0),points:stat?.appliedTotal??null};}
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 const days=String(req.query.days||'1,2,3').split(',').map(Number);
 if(days.length<1||days.length>14||days.some(d=>!Number.isInteger(d)||d<1||d>250))return res.status(400).json({ok:false,error:'Invalid days'});
 try{
 const comparisons=await Promise.all(days.map(async day=>{
  const [roster,box]=await Promise.all([get('view=mRoster&scoringPeriodId='+day),get('view=mBoxscore&view=mMatchupScore&scoringPeriodId='+day)]);
  const a=new Map(),b=new Map();
  for(const t of roster.teams||[])for(const e of t.roster?.entries||[]){const x=evidence(e,day);if(ACTIVE.has(x.slot)&&x.minutes>0)a.set(t.id+':'+x.id,x);}
  for(const m of box.schedule||[])for(const side of ['home','away']){const t=m[side];if(!t?.teamId)continue;for(const e of t.rosterForCurrentScoringPeriod?.entries||[]){const x=evidence(e,day);if(ACTIVE.has(x.slot)&&x.minutes>0)b.set(t.teamId+':'+x.id,x);}}
  const onlyRoster=[...a.keys()].filter(k=>!b.has(k));
  const onlyBoxscore=[...b.keys()].filter(k=>!a.has(k));
  const slotMismatches=[...a.keys()].filter(k=>b.has(k)&&a.get(k).slot!==b.get(k).slot).map(k=>({key:k,rosterSlot:a.get(k).slot,boxscoreSlot:b.get(k).slot}));
  return {day,rosterCount:a.size,boxscoreCount:b.size,match:!onlyRoster.length&&!onlyBoxscore.length&&!slotMismatches.length,onlyRoster,onlyBoxscore,slotMismatches,teams:[...new Set([...a.keys(),...b.keys()].map(k=>Number(k.split(':')[0])))].sort((x,y)=>x-y).map(teamId=>({teamId,rosterCount:[...a.keys()].filter(k=>k.startsWith(teamId+':')).length,boxscoreCount:[...b.keys()].filter(k=>k.startsWith(teamId+':')).length}))};
 }));
 const match=comparisons.every(x=>x.match);
 return res.status(200).json({ok:true,verified:match,verificationScope:'ESPN mRoster versus independent ESPN mBoxscore for active players with minutes > 0, by player and day',days,match,comparisons,limitations:'Does not independently prove game-cap lock ordering or finalized historical lineup immutability.'});
 }catch(e){return res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};