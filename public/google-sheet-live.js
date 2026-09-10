// Live 2027 dynasty data overlay. Google is read server-side by /api/google-sheet-live.
// Existing static data remains the fallback if the live feed is unavailable or invalid.
(function(){
  const ENDPOINT='/api/google-sheet-live';
  const REFRESH_MS=10*60*1000;
  let live=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function route(){
    const p=location.hash.replace(/^#/,'').split('/');
    return {fid:p[1]||'',tab:p[2]||'overview'};
  }
  function seasonIs2027(){return String(document.getElementById('seasonSelect')?.value||'2027')==='2027';}
  function unitCells(units,years){return years.map((_,i)=>`<td class="contract-year-unit">${units?.[i]??''}</td>`).join('');}
  function playerCell(row,marker){
    const twoWay=row.slot==='TW';
    const badge=marker?`<span class="roster-count-badge">${esc(marker)}</span>`:'';
    const name=row.display?`<span class="roster-player-name">${esc(row.display)}</span>`:'<span class="cap-empty-slot">Open slot</span>';
    const status=twoWay?'<small class="contract-status-note">TWO WAY · CAP EXEMPT</small>':'';
    return `<span class="roster-player-line">${badge}${name}${status}</span>`;
  }

  function renderCap(){
    if(!live?.ok||!seasonIs2027())return;
    const {fid,tab}=route();
    if(!fid||!['overview','roster'].includes(tab))return;
    const data=live.teams?.[fid];
    if(!data?.main?.length)return;
    const table=document.querySelector('.team-panel .team-table');
    if(!table)return;
    const panel=table.closest('.team-panel');
    if(!panel)return;
    const years=live.years||[];
    let activeNumber=0;
    const numberedRows=data.main.map(row=>{
      let marker='';
      if(row.slot!=='TW'&&row.display)marker=String(++activeNumber);
      return {row,marker};
    });
    const sectionMeta=panel.querySelector('.section-title span');
    if(sectionMeta)sectionMeta.textContent=`${activeNumber} active player${activeNumber===1?'':'s'} · Two-Way excluded`;
    table.classList.add('contract-year-grid','corrected-cap-grid','live-sheet-cap-grid');
    table.innerHTML=`<thead><tr><th class="contract-player-col">Player</th>${years.map(y=>`<th class="contract-year-head">${esc(y)}</th>`).join('')}</tr></thead>
      <tbody>${numberedRows.map(({row,marker})=>`<tr class="${row.slot==='TW'?'two-way-cap-exempt':''}"><td class="contract-player-col">${playerCell(row,marker)}</td>${unitCells(row.units,years)}</tr>`).join('')}
      <tr class="team-total-row"><td class="contract-player-col"><strong>TEAM TOTAL</strong></td>${(data.totals||[]).map(v=>`<td class="contract-year-total"><strong>${v??0}</strong></td>`).join('')}</tr></tbody>`;

    document.querySelector('.corrected-g-league')?.remove();
    const section=document.createElement('section');
    section.className='card team-panel g-league-reserves-card corrected-g-league live-sheet-g-league';
    section.innerHTML=`<div class="card-pad section-title"><div><div class="eyebrow">DEVELOPMENT ROSTER</div><h2>G-League</h2></div><span>5 roster slots · does not count toward cap</span></div>
      <div class="table-wrap"><table class="data-table contract-year-grid g-league-table"><thead><tr><th class="contract-player-col">Player</th>${years.map(y=>`<th class="contract-year-head">${esc(y)}</th>`).join('')}</tr></thead>
      <tbody>${(data.gLeague||[]).slice(0,5).map(row=>`<tr><td class="contract-player-col">${row.display?esc(row.display):'<span class="cap-empty-slot">Open slot</span>'}</td>${unitCells(row.units,years)}</tr>`).join('')}</tbody></table></div>`;
    let stack=panel.closest('.corrected-overview-roster-stack');
    if(!stack){stack=document.createElement('div');stack.className='corrected-overview-roster-stack';panel.parentNode.insertBefore(stack,panel);stack.appendChild(panel);}
    stack.appendChild(section);
  }

  function renderPicks(){
    if(!live?.ok||!seasonIs2027())return;
    const {fid,tab}=route();
    if(tab!=='picks'||!fid)return;
    const rows=live.teams?.[fid]?.futurePicks;
    if(!rows?.length)return;
    const subhead=document.querySelector('.team-subhead');
    const pickCards=document.querySelector('.pick-cards');
    if(!subhead||!pickCards)return;
    document.querySelector('.future-draft-picks-card')?.remove();
    const years=[...new Set(rows.map(r=>r.year))].sort((a,b)=>a-b);
    const section=document.createElement('section');
    section.className='card future-draft-picks-card live-sheet-future-picks';
    section.innerHTML=`<div class="card-pad section-title"><div><div class="eyebrow">CURRENT DRAFT CAPITAL</div><h2>Future Draft Picks</h2></div><span>Live master sheet · 10-minute refresh</span></div>
      <div class="future-picks-years">${years.map(year=>`<div class="future-pick-year"><div class="future-pick-year-title">${year}</div><div class="table-wrap"><table class="data-table future-picks-table"><thead><tr><th>Round</th><th>Status</th><th>Details</th></tr></thead><tbody>${rows.filter(r=>r.year===year).map(r=>`<tr class="${r.traded?'traded-pick':''}"><td>${esc(r.label)}</td><td>${r.traded?'TRADED':'OWNED'}</td><td>${esc(r.note||'')}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}</div>`;
    pickCards.parentNode.insertBefore(section,pickCards);
  }

  function render(){setTimeout(()=>{renderCap();renderPicks();},80);}

  async function refresh(){
    try{
      const response=await fetch(`${ENDPOINT}?refresh=${Date.now()}`,{cache:'no-store'});
      const data=await response.json();
      if(response.ok&&data?.ok&&data?.season===2027&&data?.teams){live=data;window.DYNASTY_LIVE_SHEET=data;render();}
      else console.info('Dynasty live sheet fallback active:',data?.message||response.status);
    }catch(err){console.info('Dynasty live sheet fallback active:',err?.message||err);}
  }

  window.addEventListener('hashchange',render);
  document.getElementById('seasonSelect')?.addEventListener('change',render);
  refresh();
  setInterval(refresh,REFRESH_MS);
})();
