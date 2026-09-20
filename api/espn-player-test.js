const ESPN_BASE = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE_ID = '76513288';

export default async function handler(req, res) {
  const season = String(req.query.season || '2026').replace(/[^0-9]/g, '') || '2026';
  const url = `${ESPN_BASE}/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?view=kona_player_info&view=kona_playercard`;
  try {
    const upstream = await fetch(url, {headers:{'User-Agent':'dynastynba.com salary engine test','x-fantasy-filter':JSON.stringify({players:{limit:2000,sortPercOwned:{sortPriority:1,sortAsc:false}}})}});
    const body = await upstream.text();
    if (!upstream.ok) return res.status(502).send(body);
    const data = JSON.parse(body);
    const rows=(data.players||[]).map(entry=>{const p=entry.player||{}; const stat=(p.stats||[]).find(s=>Number(s.seasonId)===Number(season)&&Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===0); const seasons=(p.stats||[]).filter(s=>Number(s.statSourceId)===0&&Number(s.statSplitTypeId)===0&&Number(s.seasonId)>0).map(s=>Number(s.seasonId)); const firstSeason=seasons.length?Math.min(...seasons):null; return {player:p.fullName||null,espnId:p.id??entry.id??null,gp:stat?.stats?.['42']??null,fp:stat?.appliedTotal??null,ppg:stat?.appliedAverage??null,entryYear:firstSeason?firstSeason-1:null};}).filter(r=>r.gp!==null).sort((a,b)=>(b.ppg??-999)-(a.ppg??-999));
    const offset=Math.max(0,Number(req.query.offset||0)), limit=Math.min(250,Math.max(1,Number(req.query.limit||200)));
    if(String(req.query.format||'')==='tsv'){const page=rows.slice(offset,offset+limit); res.setHeader('content-type','text/plain; charset=utf-8');res.setHeader('cache-control','no-store');return res.status(200).send(['COUNT\t'+rows.length,...page.map(r=>[r.player,r.espnId,r.gp,r.fp,r.ppg].join('\t'))].join('\n'));}
    if(String(req.query.compact||'')==='1') return res.status(200).json({season:Number(season),validCount:rows.length,players:rows.slice(offset,offset+limit)});
    res.setHeader('content-type','application/json; charset=utf-8');res.status(200).send(body);
  } catch(error){res.status(500).json({ok:false,error:String(error?.message||error)});}
}