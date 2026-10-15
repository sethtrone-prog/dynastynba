const PLAYERS = [{id:'3032977',name:'Giannis Antetokounmpo'},{id:'3059318',name:'Joel Embiid'},{id:'1966',name:'LeBron James'}];
async function json(url) {
  const r = await fetch(url,{signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw Error('ESPN unavailable');
  return r.json();
}
export function gamesPlayed(data,season,started) {
  if(data.filters?.find(f=>f.name==='seasontype')?.value !== '2') throw Error('Wrong season type');
  const category=data.categories?.find(c=>c.names?.includes('gamesPlayed'));
  if(!category) throw Error('Games played unavailable');
  const rows=category.statistics?.filter(r=>Number(r.season?.year)===season)||[];
  if(!rows.length) return started ? null : 0;
  const index=category.names.indexOf('gamesPlayed');
  // ESPN supplies a combined row when an athlete has played for multiple teams.
  const total=rows.find(r=>r.teamSlug==='total'||r.teamSlug==='tot'||r.teamId==='0'||r.teamId==='-1');
  const selected=total?[total]:rows;
  const values=selected.map(r=>r.stats[index]);
  if(values.some(v=>v==null||v===''||!Number.isInteger(Number(v))||Number(v)<0))throw Error('Invalid games played');
  return values.reduce((sum,v)=>sum+Number(v),0);
}
export default async function handler(req,res) {
  const season=Number(req.query.season||2027);
  if(!Number.isInteger(season)||season<2027||season>2100)return res.status(400).json({ok:false});
  try {
    const [standings,...stats]=await Promise.all([
      json(`https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${season}&seasontype=2&level=2`),
      ...PLAYERS.map(p=>json(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${p.id}/stats?season=${season}&seasontype=2`))
    ]);
    const groups=standings.children?.filter(g=>g.isConference);
    if(groups?.length!==2||groups.some(g=>Number(g.standings?.season)!==season||Number(g.standings?.seasonType)!==2))throw Error('Season unavailable');
    const entries=groups.flatMap(g=>g.standings.entries||[]);
    if(entries.length!==30)throw Error('Standings incomplete');
    const played=entries.map(e=>['wins','losses'].reduce((sum,key)=>{const n=e.stats.find(s=>s.name===key)?.value;if(!Number.isInteger(n)||n<0)throw Error('Record unavailable');return sum+n;},0));
    const started=played.some(n=>n>0),final=played.every(n=>n>=82);
    const players=PLAYERS.map((p,i)=>({...p,games:gamesPlayed(stats[i],season,started)}));
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=120');
    return res.json({ok:true,season,started,final,players,updatedAt:new Date().toISOString(),source:'ESPN'});
  }catch{
    res.setHeader('Cache-Control','no-store');
    return res.status(502).json({ok:false,error:'Player games played are temporarily unavailable.'});
  }
}
