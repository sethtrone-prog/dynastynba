const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE='76513288';
const targets=['luka doncic','lauri markkanen'];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const pick=o=>Object.fromEntries(Object.entries(o||{}).filter(([k])=>/injur|status|health|availability|detail|description/i.test(k)));
async function fantasy(season){
 const url=`${BASE}/seasons/${season}/segments/0/leagues/${LEAGUE}?view=kona_player_info&view=kona_playercard&view=mTeam`;
 const r=await fetch(url,{headers:{'User-Agent':'DynastyNBA injury comparison','x-fantasy-filter':JSON.stringify({players:{limit:2000,sortPercOwned:{sortPriority:1,sortAsc:false}}})},cache:'no-store'});
 if(!r.ok)throw Error('ESPN Fantasy '+season+' HTTP '+r.status);
 const j=await r.json();
 return (j.players||[]).filter(x=>targets.includes(norm(x.player?.fullName))).map(x=>({name:x.player.fullName,id:x.player.id,fields:pick(x.player)}));
}
async function nba(id){
 const url=`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes/${id}`;
 try{
  const r=await fetch(url,{cache:'no-store'});
  if(!r.ok)return {available:false,httpStatus:r.status};
  const j=await r.json();
  const a=j.athlete||j;
  return {available:true,name:a.displayName||a.fullName||null,fields:pick(a),status:a.status??null,injuries:a.injuries??null};
 }catch(e){return {available:false,error:String(e.message||e)}}
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const seasons=['2026','2027'];
 const outcomes=await Promise.allSettled(seasons.map(fantasy));
 const datasets=Object.fromEntries(seasons.map((s,i)=>[s,outcomes[i].status==='fulfilled'?{ok:true,players:outcomes[i].value}:{ok:false,error:String(outcomes[i].reason)}]));
 const ids=[...new Set(Object.values(datasets).flatMap(x=>x.players||[]).map(p=>p.id).filter(Boolean))];
 const nbaResults=await Promise.all(ids.map(async id=>({id,result:await nba(id)})));
 const rows=targets.map(name=>{
  const bySeason=Object.fromEntries(seasons.map(s=>[s,(datasets[s].players||[]).find(p=>norm(p.name)===name)||null]));
  const id=bySeason['2027']?.id||bySeason['2026']?.id;
  return {player:name,espnFantasy2026:bySeason['2026'],espnFantasy2027:bySeason['2027'],espnNBA:nbaResults.find(x=>x.id===id)?.result||null};
 });
 res.status(200).json({ok:true,note:'Read-only comparison of raw fields. ESPN NBA endpoint may not expose fantasy UI DTD label.',sources:{fantasy2026:datasets['2026'].ok?'available':datasets['2026'].error,fantasy2027:datasets['2027'].ok?'available':datasets['2027'].error},rows});
}