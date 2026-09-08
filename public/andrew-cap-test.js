// Temporary 2027 F01 cap-sheet test sourced from the corrected "Andrew Cap" workbook tab.
(function () {
  const TEST_FID = 'F01';
  const TEST_SEASON = 2027;
  const YEARS = ['2026-2027','2027-2028','2028-2029','2029-2030','2030-2031'];
  const MAIN_ROSTER = [
    { name:'Kawhi Leonard', note:'NT 12/15', status:'ACTIVE', units:[4,null,null,null,null] },
    { name:'Lebron James', note:'NT 12/15', status:'ACTIVE', units:[4,null,null,null,null] },
    { name:'Chet Holmgren', note:'RME · NT 12/15', status:'ACTIVE', units:[3,3,3,null,null] },
    { name:'Devin Vassell', note:'PRME', status:'ACTIVE', units:[2,null,null,null,null] },
    { name:'Derrick White', note:'', status:'ACTIVE', units:[2,null,null,null,null] },
    { name:'Michael Porter Jr.', note:'', status:'ACTIVE', units:[2,null,null,null,null] },
    { name:'Patrick Williams', note:'', status:'ACTIVE', units:[1,null,null,null,null] },
    { name:'Alex Sarr', note:'PRME', status:'ACTIVE', units:[1,1,null,null,null] },
    { name:'Donovan Clingan', note:'PRME', status:'ACTIVE', units:[1,1,null,null,null] },
    { name:'Victor Wembanyama', note:'RME', status:'ACTIVE', units:[1,null,null,null,null] },
    { name:'Dylan Harper', note:'TWO WAY · CAP EXEMPT', status:'TW', units:[1,1,1,null,null] },
    { name:'Ace Bailey', note:'TWO WAY · CAP EXEMPT', status:'TW', units:[1,1,1,null,null] }
  ];
  const G_LEAGUE = [
    { name:'Kingston Flemings', note:'PRME · 0 games', units:[1,1,1,1,null] },
    { name:'Sergio De Larrea', note:'PRME · 0 games', units:[1,1,1,1,null] },
    { name:'', note:'', units:[null,null,null,null,null] },
    { name:'', note:'', units:[null,null,null,null,null] },
    { name:'', note:'', units:[null,null,null,null,null] }
  ];
  const CAP_TOTALS = [21,5,3,0,0];
  function escLocal(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
  function norm(value){return String(value||'').trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();}
  function currentRouteIsTest(){const parts=location.hash.replace(/^#/,'').split('/');const currentSeason=Number(typeof season!=='undefined'?season:document.getElementById('seasonSelect')?.value);return parts[0]==='team'&&parts[1]===TEST_FID&&(!parts[2]||parts[2]==='overview')&&currentSeason===TEST_SEASON;}
  function playerIdFor(name){if(!name||typeof DB==='undefined'||!DB?.Players)return '';const target=norm(name);return DB.Players.find(p=>norm(p.Player_Name)===target)?.Player_ID||'';}
  function playerCell(row){if(!row.name)return '<span class="andrew-empty-slot">Available G-League slot</span>';const pid=playerIdFor(row.name);const name=pid?`<span class="player-link" onclick="go('player/${pid}')">${escLocal(row.name)}</span>`:escLocal(row.name);return `${name}${row.note?`<small class="contract-status-note">${escLocal(row.note)}</small>`:''}`;}
  function unitCells(units){return YEARS.map((_,i)=>`<td class="contract-year-unit">${units[i]??''}</td>`).join('');}
  function applyAndrewTest(){
    if(!currentRouteIsTest())return;
    const table=document.querySelector('.team-panel .team-table');if(!table)return;
    const panel=table.closest('.team-panel');if(!panel)return;
    table.classList.add('contract-year-grid','andrew-cap-test-grid');
    table.innerHTML=`<thead><tr><th class="contract-player-col">Player</th>${YEARS.map(y=>`<th class="contract-year-head">${y}</th>`).join('')}</tr></thead><tbody>${MAIN_ROSTER.map(row=>`<tr class="contract-roster-row${row.status==='TW'?' two-way-cap-exempt':''}"><td class="contract-player-col">${playerCell(row)}</td>${unitCells(row.units)}</tr>`).join('')}</tbody><tfoot><tr class="contract-grid-total"><th>CAP TOTAL</th>${CAP_TOTALS.map(v=>`<th class="contract-year-total">${v}</th>`).join('')}</tr></tfoot>`;
    document.querySelector('.g-league-reserves-card')?.remove();
    const section=document.createElement('section');section.className='card team-panel g-league-reserves-card andrew-g-league-test';
    section.innerHTML=`<div class="card-pad section-title"><div><div class="eyebrow">DEVELOPMENT ROSTER</div><h2>G-League</h2></div><span>5 roster slots · does not count toward cap</span></div><div class="table-wrap"><table class="data-table contract-year-grid g-league-table"><thead><tr><th class="contract-player-col">Player</th>${YEARS.map(y=>`<th class="contract-year-head">${y}</th>`).join('')}</tr></thead><tbody>${G_LEAGUE.map(row=>`<tr><td class="contract-player-col">${playerCell(row)}</td>${unitCells(row.units)}</tr>`).join('')}</tbody></table></div>`;
    // The team page uses a multi-column grid. Wrap both cards in a full-width stack so
    // G-League is physically below the roster instead of becoming the next grid column.
    let stack=panel.closest('.andrew-overview-roster-stack');
    if(!stack){stack=document.createElement('div');stack.className='andrew-overview-roster-stack';panel.parentNode.insertBefore(stack,panel);stack.appendChild(panel);}
    stack.appendChild(section);
  }
  function schedule(){setTimeout(applyAndrewTest,25);}
  window.addEventListener('hashchange',schedule);
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="go(\'team/"], [data-route="teams"]'))schedule();});
  document.getElementById('seasonSelect')?.addEventListener('change',schedule);if(location.hash.startsWith('#team/'))schedule();
  const style=document.createElement('style');style.textContent=`.andrew-overview-roster-stack{grid-column:1/-1;display:flex;flex-direction:column;gap:16px;width:100%;min-width:0}.andrew-overview-roster-stack>.team-panel{width:100%;box-sizing:border-box}.andrew-cap-test-grid .two-way-cap-exempt td{opacity:.82}.andrew-g-league-test{margin-top:0!important}.andrew-g-league-test .contract-year-grid{min-width:720px}.andrew-empty-slot{opacity:.35;font-style:italic}`;document.head.appendChild(style);
})();
