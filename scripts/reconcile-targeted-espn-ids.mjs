// Targeted ESPN ID reconciliation. Run with --apply only after reviewing the audit.
// Source: validation/espn-2026-full-player-pool.csv (2025-26 NBA data).
import fs from 'node:fs';
const path = 'public/data/site-data.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const expected = {
  "dayron sharpe":4432194, "dereck lively ii":4683688,
  "adou thiero":5060631, "liam mcneeley":5239590,
  "ty jerome":4065733, "yanic konan niederhauser":5108024,
  "will richard":4897262, "kobe sanders":4702352
};
const targets = [
"Chris Cenac Jr.","Day'Ron Sharpe","Nate Ament","Cameron Carr","Maleek Thomas",
"Bennet Stirtz","Derek Lively II","Trevon Brazile","Yaxel Lendeburg",
"Adou Thiero","Liam McNeeley","Joshua Jefferson","Ty Jerome",
"Tarris Reed Jr.","Jayden Quaintance","Christian Anderson",
"Yanic Konan Niederhauser","Karim Lopez","Koa Peat","Will Richard",
"Ryan Conwell","Kobe Sanders"];
const norm = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim()
  .replace(/^derek lively ii$/, 'dereck lively ii').replace(/^bennet stirtz$/, 'bennett stirtz');
const apply = process.argv.includes('--apply');
const report = [];
for (const name of targets) {
 const matches = (db.Players||[]).filter(p=>norm(p.Player_Name)===norm(name));
 const id = expected[norm(name)] || null;
 let status = !matches.length ? 'not-in-master' : matches.length>1 ? 'ambiguous-master-name' : !id ? 'needs-verified-nba-id' : 'verified-candidate';
 if(matches.length===1 && id) {
   const p=matches[0];
   if(p.ESPN_Player_ID && Number(p.ESPN_Player_ID)!==id) status='conflicting-existing-id';
   else if(Number(p.ESPN_Player_ID)===id) status='already-linked';
   else if(apply) {p.ESPN_Player_ID=id; status='linked';}
 }
 report.push({name,playerId:matches.length===1?matches[0].Player_ID:null,espnId:id,status});
}
if(apply) fs.writeFileSync(path,JSON.stringify(db,null,2)+'\n');
fs.mkdirSync('validation',{recursive:true});
fs.writeFileSync('validation/targeted-espn-link-audit.json',JSON.stringify({source:'2026 ESPN player pool CSV',apply,report},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
