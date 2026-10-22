// Lock monitor readiness check. Do not write inaccurate locks before validating ESPN lineups.
const ESPN='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
const NBA='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
async function get(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function etDate(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return p.year+p.month+p.day}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const hasStorage=Boolean(process.env.BLOB_READ_WRITE_TOKEN);
 const hasSecret=Boolean(process.env.CRON_SECRET);
 if(!hasStorage)return res.status(503).json({ok:false,configured:false,error:'Blob storage token missing'});
 if(!hasSecret)return res.status(503).json({ok:false,configured:false,error:'CRON_SECRET missing. Automatic writes disabled.'});
 if(req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)return res.status(401).json({ok:false,error:'Unauthorized'});
 try{
  const [league,nba]=await Promise.all([get(ESPN+'?view=mRoster&view=mStatus'),get(NBA+'?dates='+etDate())]);
  const teams=(league.teams||[]).filter(t=>Array.isArray(t.roster?.entries));
  res.json({ok:true,configured:true,rosterTeams:teams.length,nbaGames:(nba.events||[]).length,writeEnabled:false,reason:'Read-only until eligible lineup slots and historical daily lineup fidelity are validated. No irreversible records written.'});
 }catch(e){res.status(502).json({ok:false,error:e.message})}
}