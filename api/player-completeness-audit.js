const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const clean=s=>String(s||'').replace(/\s*-\s*NT\b.*$/i,'').replace(/\b(?:PRME|RME)\b.*$/i,'').replace(/\([^)]*\)/g,'').replace(/\*+/g,'').trim();
const status=slot=>/^TW$/i.test(String(slot||'').trim())?'TW':/^IR$/i.test(String(slot||'').trim())?'IR':/^DPE$/i.test(String(slot||'').trim())?'DPE':'Active';
async function json(url){const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error(url+' returned '+r.status);return r.json();}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
 try{
  const [dbText,mapText,espn,sheet]=await Promise.all([
   fetch('https://www.dynastynba.com/data/site-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Site database unavailable');return r.text()}),
   fetch('https://www.dynastynba.com/verified-espn-ids.js',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Verified mapping unavailable');return r.text()}),
   json('https://www.dynastynba.com/api/espn-player-test?season=2027&compact=1'),
   json('https://www.dynastynba.com/api/google-sheet-live')
  ]);
  if(!sheet.ok||!sheet.teams||Object.keys(sheet.teams).length!==10)throw Error('Incomplete Google Sheet ownership data; classification halted');
  if(!Array.isArray(espn.players)||!espn.players.length)throw Error('Incomplete ESPN player response');
  const db=JSON.parse(dbText), match=mapText.match(/window\.VERIFIED_ESPN_IDS\s*=\s*(\{[^;]+\})/);
  if(!match)throw Error('Verified ESPN mapping not found');
  const verified=JSON.parse(match[1]),byId=new Map(),byName=new Map();
  for(const p of db.Players||[]){const id=verified[p.Player_ID]||p.ESPN_Player_ID;if(id)byId.set(String(id),p);const n=norm(p.Player_Name);if(n){const arr=byName.get(n)||[];arr.push(p);byName.set(n,arr)}}
  const owners=new Map(),duplicates=[];
  function add(name,team,designation){const key=norm(clean(name));if(!key)return;const item={franchiseId:team,designation,sourceName:name};const list=owners.get(key)||[];list.push(item);owners.set(key,list)}
  for(const [fid,team] of Object.entries(sheet.teams)){
   for(const row of team.main||[]){if(!row.display||!/^(?:\d+|TW|IR|DPE)$/i.test(String(row.slot||'').trim()))continue;add(row.display,fid,status(row.slot))}
   for(const row of team.gLeague||[])if(row.display)add(row.display,fid,'G-League');
  }
  for(const [name,list] of owners)if(list.length>1)duplicates.push({name,owners:list});
  const results=[],seen=new Set();
  for(const p of espn.players){if(p.espnId==null||!p.player||Number(p.gp)<=0||seen.has(String(p.espnId)))continue;seen.add(String(p.espnId));
   const key=norm(p.player),existing=byId.get(String(p.espnId)),names=byName.get(key)||[],matches=owners.get(key)||[];
   const ownership=matches.length===1?matches[0]:null;
   let finding='linked';
   if(!existing)finding=names.length?'existing_name_id_mismatch':matches.length>1?'ambiguous_ownership':matches.length===1?'missing_rostered_record':'missing_free_agent_record';
   else if(matches.length>1)finding='ambiguous_ownership';
   else if(matches.length===1){
    const rs=(db.Rosters||[]).filter(r=>r.Season_ID==='S2027'&&r.Player_ID===existing.Player_ID);
    if(!rs.some(r=>r.Franchise_ID===ownership.franchiseId&&String(r.Roster_Status).toLowerCase()===String(ownership.designation).toLowerCase()))finding='roster_discrepancy';
   }
   if(finding!=='linked')results.push({name:p.player,espnId:p.espnId,gp:p.gp??null,fppg:p.ppg??null,finding,existingPlayerId:existing?.Player_ID||null,nameMatches:names.map(x=>x.Player_ID),ownership,requiresReview:true});
  }
  const counts={};for(const x of results)counts[x.finding]=(counts[x.finding]||0)+1;
  res.status(200).json({ok:true,readOnly:true,season:2027,generatedAt:new Date().toISOString(),source:{espnPlayers:espn.players.length,permanentPlayers:db.Players.length,franchiseTabs:Object.keys(sheet.teams).length,sheetGeneratedAt:sheet.generatedAt||null,espnPoolComplete:false},counts,ownershipConflicts:duplicates,findings:results,notes:['All findings are review-only: no records or franchise ownership are changed.','ESPN returned player pool is limited; no completeness guarantee.','Sheet display-name matching is exact after annotation cleanup; aliases require review.','ESPN season statistics alone do not establish NBA participation.','IR and DPE ownership must be confirmed against dedicated roster sources.']});
 }catch(e){res.status(503).json({ok:false,readOnly:true,error:String(e.message||e),note:'No free-agent ownership classification is issued when source verification fails.'})}
}
