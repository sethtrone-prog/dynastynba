const ESPN_BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID='76513288';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const season=String(req.query.season||'2026').replace(/[^0-9]/g,'')||'2026';
  const url=`${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?view=kona_player_info&view=kona_playercard&view=mTeam`;
  try{
    const response=await fetch(url,{headers:{'User-Agent':'dynastynba.com injury diagnostic','x-fantasy-filter':JSON.stringify({players:{limit:2000,sortPercOwned:{sortPriority:1,sortAsc:false}}})},cache:'no-store'});
    if(!response.ok)return res.status(502).json({ok:false,upstreamStatus:response.status});
    const data=await response.json();
    const names=['luka doncic','lauri markkanen'];
    const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const players=(data.players||[]).filter(e=>names.includes(normalize(e.player?.fullName))).map(e=>{
      const p=e.player||{};
      const injuryFields=Object.fromEntries(Object.entries(p).filter(([k])=>/injur|status|health|availability/i.test(k)));
      return {name:p.fullName,espnId:p.id,injuryFields,playerKeys:Object.keys(p).filter(k=>/injur|status|health|availability/i.test(k))};
    });
    return res.status(200).json({ok:true,season:Number(season),matched:players.length,players});
  }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}