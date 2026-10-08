/* Historical ESPN regular-season fantasy scoring. Beta only. */
(()=>{'use strict';
const YEARS=[2027,2026,2025,2024,2023,2022,2021,2020,2019];
const cache=new Map();let pending=null,sortKey='ppg',sortAsc=false,selected=2026,query='';
const idFor=p=>String(window.VERIFIED_ESPN_IDS?.[p.Player_ID]||p.ESPN_Player_ID||'');
const fmt=(n,d=2)=>Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function season(y){if(cache.has(y))return cache.get(y);const r=await fetch('/api/espn-player-test?compact=1&season='+y);if(!r.ok)throw Error('ESPN season '+y+' unavailable');const data=await r.json();const m=new Map();for(const p of data.players||[])if(p.espnId!=null&&Number(p.gp)>0)m.set(String(p.espnId),p);cache.set(y,m);return m}
async function all(){if(!pending)pending=Promise.allSettled(YEARS.map(season));await pending}
const rowsFor=id=>YEARS.map(y=>({year:y,p:cache.get(y)?.get(id)})).filter(x=>x.p);
function section(pid){return '<section class="card span-12 player-panel" id="historicalPlayerScoring" data-player-id="'+esc(pid)+'"><div class="card-pad section-title"><div><div class="eyebrow">ESPN REGULAR SEASON</div><h2>Scoring History & Career Statistics</h2></div></div><div class="card-pad">Loading historical player statistics…</div></section>'}
function tableRows(rows){return rows.map(x=>'<tr><td>'+esc(x.year-1)+'–'+String(x.year).slice(-2)+'</td><td class="num stat-ppg"><b>'+fmt(x.p.ppg)+'</b></td><td class="num stat-points">'+fmt(x.p.fp)+'</td><td class="num stat-games">'+fmt(x.p.gp,0)+'</td></tr>').join('')}
async function playerCard(pid){const host=document.getElementById('historicalPlayerScoring');if(!host||host.dataset.playerId!==pid)return;const p=(window.DB?.Players||[]).find(x=>String(x.Player_ID)===pid),id=p&&idFor(p);if(!id){host.querySelector('.card-pad:last-child').textContent='No verified ESPN ID available for this player.';return}await all();if(!host.isConnected||host.dataset.playerId!==pid)return;const rows=rowsFor(id),games=rows.reduce((a,x)=>a+Number(x.p.gp||0),0),points=rows.reduce((a,x)=>a+Number(x.p.fp||0),0);host.querySelector('.card-pad:last-child').innerHTML=rows.length?'<div class="historical-summary"><div><b>'+fmt(games?points/games:null)+'</b><span>Career FPPG</span></div><div><b>'+fmt(games,0)+'</b><span>Games played</span></div><div><b>'+fmt(points)+'</b><span>Total fantasy points</span></div><div><b>'+rows.length+'</b><span>Seasons with games</span></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>NBA Season</th><th class="stat-numeric-head">PPG</th><th class="stat-numeric-head">TOTAL PTS</th><th class="stat-numeric-head">GAMES PLAYED</th></tr></thead><tbody>'+tableRows(rows)+'</tbody></table></div><p class="historical-note">ESPN fantasy scoring · 2018–19 onward, including 2026–27 when ESPN reports games. Career totals shown are coverage-period totals, not necessarily full NBA career totals.</p>':'No historical scoring records found in available ESPN seasons.'}
function statistics(){const host=document.getElementById('statisticsRoot');if(!host)return;host.innerHTML='<div class="reference-tools"><input id="statSearch" placeholder="Search players…" value="'+esc(query)+'"><select id="statSeason"><option value="all" '+(selected==='all'?'selected':'')+'>ALL SEASONS</option>'+YEARS.map(y=>'<option value="'+y+'" '+(y===selected?'selected':'')+'>'+(y-1)+'–'+String(y).slice(-2)+'</option>').join('')+'</select><span id="statCount"></span></div><div class="card"><div class="table-wrap"><table class="data-table reference-table" id="statTable"><thead><tr><th data-stat-sort="player">Player ↕</th><th data-stat-sort="year">YEAR ↕</th><th class="stat-numeric-head" data-stat-sort="ppg">PPG ↕</th><th class="stat-numeric-head" data-stat-sort="fp">TOTAL PTS ↕</th><th class="stat-numeric-head" data-stat-sort="gp">GAMES PLAYED ↕</th></tr></thead><tbody></tbody></table></div></div><p class="historical-note">NBA regular-season ESPN fantasy points. Click column headings to sort. Historical coverage begins in 2018–19. The 2026–27 season updates automatically from ESPN as completed NBA games are recorded; all-seasons mode shows one row per player per season.</p>';host.querySelector('#statSearch').oninput=e=>{query=e.target.value;fill()};host.querySelector('#statSeason').onchange=e=>{selected=e.target.value==='all'?'all':Number(e.target.value);fill()};host.querySelectorAll('[data-stat-sort]').forEach(th=>{th.style.cursor='pointer';th.onclick=()=>{const k=th.dataset.statSort;if(sortKey===k)sortAsc=!sortAsc;else{sortKey=k;sortAsc=k==='player'}fill()}});fill()}
function fill(){
const host=document.getElementById('statisticsRoot');if(!host)return;
const years=selected==='all'?YEARS:[selected];
const missing=years.filter(y=>!cache.has(y));
if(missing.length){
 host.querySelector('#statCount').textContent='Loading '+missing.length+' season'+(missing.length===1?'':'s')+'…';
 Promise.allSettled(missing.map(season)).then(()=>{if(host.isConnected)renderRows()});
 return;
}
renderRows();
}
function renderRows(){
const host=document.getElementById('statisticsRoot');if(!host)return;
const years=selected==='all'?YEARS:[selected],players=window.DB?.Players||[],rows=[];
const q=query.toLowerCase(),seen=new Set();
for(const p of players){
 const id=idFor(p);if(!id||!String(p.Player_Name||'').toLowerCase().includes(q))continue;
 for(const year of years){
  const x=cache.get(year)?.get(id),key=id+':'+year;
  if(!x||seen.has(key))continue;seen.add(key);
  rows.push({pid:p.Player_ID,player:p.Player_Name,year,gp:Number(x.gp),fp:Number(x.fp),ppg:Number(x.ppg)});
 }
}
rows.sort((a,b)=>{
 const d=sortKey==='player'?a.player.localeCompare(b.player):a[sortKey]-b[sortKey];
 return (sortAsc?1:-1)*d || b.year-a.year || a.player.localeCompare(b.player);
});
host.querySelector('#statCount').textContent=rows.length+' player-season records'+(selected==='all'?' · all available seasons':'');
host.querySelector('tbody').innerHTML=rows.map(r=>'<tr class="clickable" data-stat-player="'+esc(r.pid)+'"><td><b>'+esc(r.player)+'</b></td><td class="stat-year">'+(r.year-1)+'–'+String(r.year).slice(-2)+'</td><td class="num stat-ppg"><b>'+fmt(r.ppg)+'</b></td><td class="num stat-points">'+fmt(r.fp)+'</td><td class="num stat-games">'+fmt(r.gp,0)+'</td></tr>').join('')||'<tr><td colspan="5">No matching player-season records.</td></tr>';
host.querySelectorAll('[data-stat-player]').forEach(tr=>tr.onclick=()=>window.go('player/'+tr.dataset.statPlayer));
}
function show(){const h=location.hash||'';if(h==='#statistics'){statistics()}else if(h.startsWith('#player/')){const pid=decodeURIComponent(h.slice(8));const card=document.getElementById('historicalPlayerScoring');if(card)playerCard(pid).catch(e=>{if(card.isConnected)card.querySelector('.card-pad:last-child').textContent='Historical scoring unavailable: '+e.message})}}
window.DynastyHistoricalStats={section,show,statistics};})();
