import fs from 'node:fs';
const file=process.argv[2]||'public/data/site-data.json';
const reportFile=process.argv[3]||'validation/player-link-audit.json';
const apply=process.argv.includes('--apply');
const db=JSON.parse(fs.readFileSync(file,'utf8'));
const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[’'\`]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const espn=db['ESPN Rosters']||[];
const byName=new Map();
for(const e of espn){const n=norm(e.Player_Name);if(!n||!e.ESPN_Player_ID)continue;if(!byName.has(n))byName.set(n,new Map());byName.get(n).set(String(e.ESPN_Player_ID),e)}
const linked=[],ambiguous=[],unmatched=[];
for(const p of db.Players||[]){if(!p.Player_ID||!p.Player_Name||p.ESPN_Player_ID)continue;const m=[...(byName.get(norm(p.Player_Name))||new Map()).values()];if(m.length===1){const e=m[0];const row={Player_ID:p.Player_ID,Player_Name:p.Player_Name,ESPN_Player_ID:e.ESPN_Player_ID,ESPN_Name:e.Player_Name};linked.push(row);if(apply){p.ESPN_Player_ID=e.ESPN_Player_ID;p.ESPN_Pro_Team_ID=e.Pro_Team_ID??p.ESPN_Pro_Team_ID??null;p.ESPN_Default_Position_ID=e.Default_Position_ID??p.ESPN_Default_Position_ID??null;p.ESPN_Active=e.Active??p.ESPN_Active??null;p.ESPN_Injury_Status=e.Injury_Status??p.ESPN_Injury_Status??null;p.ESPN_Last_Sync_Season=e.Season_ID??p.ESPN_Last_Sync_Season??null}}else if(m.length>1)ambiguous.push({Player_ID:p.Player_ID,Player_Name:p.Player_Name,candidates:m.map(e=>({ESPN_Player_ID:e.ESPN_Player_ID,Player_Name:e.Player_Name}))});else unmatched.push({Player_ID:p.Player_ID,Player_Name:p.Player_Name})}
const report={generated_at:new Date().toISOString(),mode:apply?'apply':'audit',rule:'Only one exact normalized-name ESPN roster match is auto-linked.',linked_count:linked.length,ambiguous_count:ambiguous.length,unmatched_count:unmatched.length,linked,ambiguous,unmatched};
fs.mkdirSync(reportFile.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');if(apply)fs.writeFileSync(file,JSON.stringify(db,null,2)+'\n');console.log(JSON.stringify({linked:linked.length,ambiguous:ambiguous.length,unmatched:unmatched.length,apply},null,2));