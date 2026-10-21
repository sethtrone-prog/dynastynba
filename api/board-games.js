const PLAYERS=[{id:'3032977',name:'Giannis Antetokounmpo'},{id:'3059318',name:'Joel Embiid'},{id:'1966',name:'LeBron James'}];
const ESPN_BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID='76513288';
export default async function handler(req,res) {
 const season=Number(req.query.season||2027);
 if(!Number.isInteger(season)||season<2027||season>2100)return res.status(400).json({ok:false});
 try {
  const url=`${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?view=kona_player_info&view=kona_playercard&view=mTeam`;
  const upstream=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'dynastynba.com board games played','x-fantasy-filter':JSON.stringify({players:{limit:2000,sortPercOwned:{sortPriority:1,sortAsc:false}}})}});
  if(!upstream.ok)throw Error('ESPN HTTP '+upstream.status);
  const data=await upstream.json();
  const byId=new Map((data.players||[]).map(e=>[String(e.player?.id??e.id),e.player||{}]));
  const players=PLAYERS.map(p=>{
   const athlete=byId.get(p.id);
   const stat=athlete?.stats?.find(s=>Number(s.seasonId)===season&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===0);
   const raw=stat?.stats?.['42'];
   const games=raw==null?null:Number(raw);
   if(games!==null&&(!Number.isInteger(games)||games<0))throw Error('Invalid GP: '+p.name);
   return {...p,games};
  });
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=120');
  return res.json({ok:true,season,started:players.some(p=>p.games!==null&&p.games>0),final:false,players,updatedAt:new Date().toISOString(),source:'ESPN Fantasy stat 42'});
 }catch(error){
  res.setHeader('Cache-Control','no-store');
  return res.status(502).json({ok:false,error:'ESPN Fantasy games played unavailable',detail:String(error?.message||error)});
 }
}
