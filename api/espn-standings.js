const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
const LEAGUE='76513288';
async function load(year){
 const url=BASE+'/seasons/'+year+'/segments/0/leagues/'+LEAGUE+'?view=mTeam&view=mStandings&view=mSettings';
 const r=await fetch(url,{headers:{'User-Agent':'DynastyNBA standings'}});if(!r.ok)return null;
 const data=await r.json();if(!Array.isArray(data.teams)||data.teams.length<2)return null;
 return {year,teams:data.teams.map(t=>({id:t.id,name:t.name,logo:t.logo,record:t.record||{},rank:t.playoffSeed||t.rankCalculatedFinal||null})),leagueId:data.id};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=120');
 const now=new Date(),calendar=now.getUTCFullYear(),month=now.getUTCMonth();
 const earliest=2027,upper=Math.max(earliest,calendar+(month>=6?1:0));
 const requested=Number(req.query.season);
 if(req.query.season&&(!Number.isInteger(requested)||requested<earliest||requested>upper+1))return res.status(400).json({ok:false,error:'Invalid season'});
 try{
  if(req.query.season){const d=await load(requested);return d?res.json({ok:true,activeYear:requested,seasons:[requested],data:d}):res.status(404).json({ok:false,error:'ESPN season unavailable'});}
  const candidates=[upper,upper-1].filter(y=>y>=earliest);
  const results=await Promise.all(candidates.map(load));
  const available=results.filter(Boolean);
  if(!available.length)return res.status(503).json({ok:false,error:'No verified ESPN league season available'});
  const active=available[0];
  res.json({ok:true,activeYear:active.year,seasons:available.map(x=>x.year),data:active});
 }catch(e){res.status(502).json({ok:false,error:'ESPN standings request failed'});}
}
