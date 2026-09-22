// Live dynasty data overlay. Google is read server-side by /api/google-sheet-live.
// Existing static data remains the fallback if the live feed is unavailable or invalid.
// Preview redeploy marker: roster TW indicator update verified for desktop and mobile.
(function(){
  const ENDPOINT='/api/google-sheet-live';
  const REFRESH_MS=10*60*1000;
  let live=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function route(){const p=location.hash.replace(/^#/,'').split('/');return {fid:p[1]||'',tab:p[2]||'overview'};}
  function seasonIsLive(){return live?.season&&String(document.getElementById('seasonSelect')?.value||live.season)===String(live.season);}
  function ensureSeasonOption(){
    const sel=document.getElementById('seasonSelect');if(!sel||!live?.season)return;
    if(![...sel.options].some(o=>Number(o.value)===Number(live.season))){const opt=document.createElement('option');opt.value=String(live.season);opt.textContent=String(live.season);sel.prepend(opt);}
    const maxExisting=Math.max(...[...sel.options].map(o=>Number(o.value)||0));
    if(Number(live.season)>=maxExisting&&Number(sel.value)<Number(live.season)){sel.value=String(live.season);if(typeof season!=='undefined')season=Number(live.season);if(typeof render==='function')render();}
  }
  function unitCells(units,years){return years.map((_,i)=>`<td class="contract-year-unit">${units?.[i]??''}</td>`).join('');}
  function linkedPlayerName(text){
    if(!text)return '<span class="cap-empty-slot">Open slot</span>';
    const raw=String(text),dbPlayers=(typeof DB!=='undefined'&&DB?.Players)?DB.Players:[];
    const clean=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[’'`]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
    const aliases={
      'dereck lively':{name:'dereck lively ii',id:'P0540'},
      'derik queen':{name:'derik queen'},
      'jaime jaquez':{name:'jaime jaquez jr',id:'P0381'},
      'daniss jenkins':{name:'daniss jenkins'},
      'rasheer fleming':{name:'rasheer fleming'}
    };
    const rawClean=clean(raw);
    const aliasKey=Object.keys(aliases).find(key=>rawClean.includes(key));
    let match=null;
    if(aliasKey){const a=aliases[aliasKey];match=(a.id&&dbPlayers.find(p=>p?.Player_ID===a.id))||dbPlayers.find(p=>clean(p?.Player_Name)===a.name);}
    if(!match){
      const players=dbPlayers.filter(p=>p?.Player_ID&&p?.Player_Name).slice().sort((x,y)=>String(y.Player_Name).length-String(x.Player_Name).length);
      match=players.find(p=>rawClean.includes(clean(p.Player_Name)));
    }
    if(!match)return `<span class="roster-player-name">${esc(raw)}</span>`;
    let shown=match.Player_Name;
    if(aliasKey){
      const words=aliasKey.split(' ');
      const re=new RegExp(words.map(w=>w.replace(/[^a-z0-9]/gi,'')).join('[^A-Za-z0-9]+'),'i');
      const m=raw.match(re);if(m)shown=m[0];
    }
    const start=raw.toLowerCase().indexOf(String(shown).toLowerCase());
    if(start<0)return `<span class="player-link roster-player-name" role="link" tabindex="0" onclick="event.stopPropagation();go('player/${esc(match.Player_ID)}')">${esc(raw)}</span>`;
    const before=raw.slice(0,start),after=raw.slice(start+shown.length);
    return `${esc(before)}<span class="player-link roster-player-name" role="link" tabindex="0" onclick="event.stopPropagation();go('player/${esc(match.Player_ID)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();go('player/${esc(match.Player_ID)}')}">${esc(shown)}</span>${esc(after)}`;
  }
  function playerCell(row,marker){const badge=marker?`<span class="roster-count-badge${marker==='TW'?' roster-two-way-badge':''}">${esc(marker)}</span>`:'',name=row.display?linkedPlayerName(row.display):'<span class="cap-empty-slot">Open slot</span>';return `<span class="roster-player-line">${badge}${name}</span>`;}

  function renderCap(){
    if(!live?.ok||!seasonIsLive())return;
    const {fid,tab}=route();if(!fid||!['overview','roster'].includes(tab))return;
    const data=live.teams?.[fid];if(!data?.main?.length)return;
    const table=document.querySelector('.team-panel .team-table');if(!table)return;const panel=table.closest('.team-panel');if(!panel)return;
    const years=live.years||[];let activeNumber=0;
    const numberedRows=data.main.map(row=>{let marker='';if(row.slot==='TW'&&row.display)marker='TW';else if(row.display)marker=String(++activeNumber);return {row,marker};});
    const sectionMeta=panel.querySelector('.section-title span');if(sectionMeta)sectionMeta.textContent=`${activeNumber} active player${activeNumber===1?'':'s'} · Two-Way excluded`;
    table.classList.add('contract-year-grid','corrected-cap-grid','live-sheet-cap-grid');
    table.innerHTML=`<thead><tr><th class="contract-player-col">Player</th>${years.map(y=>`<th class="contract-year-head">${esc(y)}</th>`).join('')}</tr></thead><tbody>${numberedRows.map(({row,marker})=>`<tr class="${row.slot==='TW'?'two-way-cap-exempt':''}"><td class="contract-player-col">${playerCell(row,marker)}</td>${unitCells(row.units,years)}</tr>`).join('')}<tr class="team-total-row"><td class="contract-player-col"><strong>TEAM TOTAL</strong></td>${(data.totals||[]).map(v=>`<td class="contract-year-total"><strong>${v??0}</strong></td>`).join('')}</tr></tbody>`;
    document.querySelector('.corrected-g-league')?.remove();
    const section=document.createElement('section');section.className='card team-panel g-league-reserves-card corrected-g-league live-sheet-g-league';
    section.innerHTML=`<div class="card-pad section-title"><div><div class="eyebrow">DEVELOPMENT ROSTER</div><h2>G-League</h2></div><span>5 roster slots · does not count toward cap</span></div><div class="table-wrap"><table class="data-table contract-year-grid g-league-table"><thead><tr><th class="contract-player-col">Player</th>${years.map(y=>`<th class="contract-year-head">${esc(y)}</th>`).join('')}</tr></thead><tbody>${(data.gLeague||[]).slice(0,5).map(row=>`<tr><td class="contract-player-col">${row.display?linkedPlayerName(row.display):'<span class="cap-empty-slot">Open slot</span>'}</td>${unitCells(row.units,years)}</tr>`).join('')}</tbody></table></div>`;
    let stack=panel.closest('.corrected-overview-roster-stack');if(!stack){stack=document.createElement('div');stack.className='corrected-overview-roster-stack';panel.parentNode.insertBefore(stack,panel);stack.appendChild(panel);}stack.appendChild(section);
  }

  function renderOverviewKpis(){
    if(!live?.ok||!seasonIsLive())return;const {fid,tab}=route();if(tab!=='overview'||!fid)return;const data=live.teams?.[fid];if(!data)return;
    const row=document.getElementById('teamOverviewKpis');if(!row)return;
    const currentYear=`${Number(live.season)-1}-${Number(live.season)}`;
    let yi=(live.years||[]).findIndex(y=>String(y).replace(/[–—]/g,'-').replace(/\s+/g,'')===currentYear);
    if(yi<0)yi=0;
    const totalUnits=(data.main||[]).reduce((sum,r)=>r?.slot==='TW'?sum:sum+(Number(r?.units?.[yi])||0),0);
    const active=(data.main||[]).filter(r=>r?.display&&r.slot!=='TW').length;
    const gLeague=(data.gLeague||[]).filter(r=>r?.display).length;
    let transactions=0;
    if(typeof DB!=='undefined'&&DB?.Transactions){const sid='S'+live.season;transactions=DB.Transactions.filter(x=>x.Franchise_ID===fid&&x.Season_ID===sid).length;}
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=String(value);};
    set('overviewTotalUnits',totalUnits);set('overviewActivePlayers',active);set('overviewTransactions',transactions);set('overviewGLeaguePlayers',gLeague);
  }
  function renderPicks(){
    if(!live?.ok||!seasonIsLive())return;const {fid,tab}=route();if(tab!=='picks'||!fid)return;const rows=live.teams?.[fid]?.futurePicks;if(!rows?.length)return;
    const pickCards=document.querySelector('.pick-cards');if(!pickCards)return;document.querySelector('.future-draft-picks-card')?.remove();const years=[...new Set(rows.map(r=>r.year))].sort((a,b)=>a-b),section=document.createElement('section');section.className='card future-draft-picks-card live-sheet-future-picks';
    section.innerHTML=`<div class="card-pad section-title"><div><div class="eyebrow">CURRENT DRAFT CAPITAL</div><h2>Future Draft Picks</h2></div><span>Live master sheet · 10-minute refresh</span></div><div class="future-picks-years">${years.map(year=>`<div class="future-pick-year"><div class="future-pick-year-title">${year}</div><div class="table-wrap"><table class="data-table future-picks-table"><thead><tr><th>Round</th><th>Status</th><th>Details</th></tr></thead><tbody>${rows.filter(r=>r.year===year).map(r=>`<tr class="${r.traded?'traded-pick':''}"><td>${esc(r.label)}</td><td>${r.traded?'TRADED':'OWNED'}</td><td>${esc(r.note||'')}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}</div>`;pickCards.parentNode.insertBefore(section,pickCards);
  }
  function liveContractUnitsForPlayer(playerName){
    if(!live?.ok||!playerName)return null;
    const n=String(playerName).trim().toLowerCase();
    const yearIndex=(live.years||[]).findIndex(y=>String(y).replace(/[–—]/g,'-')===`${Number(live.season)-1}-${live.season}`);
    if(yearIndex<0)return null;
    for(const team of Object.values(live.teams||{})){
      for(const row of team.main||[]){
        const display=String(row.display||'').trim().toLowerCase();
        if(display===n||display.includes(n)){
          const u=row.units?.[yearIndex];
          if(u!==null&&u!==undefined&&u!=='')return Number(u);
        }
      }
    }
    return null;
  }
  function normalizeOwnedName(v){return String(v||'').toLowerCase().normalize('NFKD').replace(/[’'\`]/g,'').replace(/\\b(two[- ]?way|tw)\\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\\s+/g,' ').trim();}
  function liveOwnedPlayers(){
    const owned=new Map();if(!live?.ok)return owned;
    for(const [fid,team] of Object.entries(live.teams||{})){
      for(const row of [...(team.main||[]),...(team.gLeague||[])]){
        if(!row?.display)continue;
        const raw=String(row.display),n=normalizeOwnedName(raw);if(!n)continue;
        const p=(typeof DB!=='undefined'&&DB?.Players||[]).find(x=>{const pn=normalizeOwnedName(x.Player_Name);return pn&&(n===pn||n.includes(pn)||pn.includes(n));});
        if(p)owned.set(p.Player_ID,{fid,row});
      }
    }
    return owned;
  }
  function renderFreeAgencyOwnership(){
    if(!live?.ok||!seasonIsLive())return;const owned=liveOwnedPlayers();
    const parts=location.hash.replace(/^#/,'').split('/');
    if(parts[0]==='player'&&parts[1]&&owned.has(parts[1])){
      const o=owned.get(parts[1]),panel=document.querySelector('.player-status-panel');
      if(panel){const team=(typeof franchiseLabel==='function'?franchiseLabel(o.fid):o.fid);panel.innerHTML=\`<b>\${o.row.slot==='TW'?'Two-Way':'Rostered'}</b><span>\${esc(team)}</span>\`;}
    }
    if(parts[0]!=='players')return;
    document.querySelectorAll('#playerTable tbody tr').forEach(tr=>{const btn=tr.querySelector('[onclick*="player/"]');const m=btn?.getAttribute('onclick')?.match(/player\\/([^'\")]+)/);if(!m)return;const o=owned.get(m[1]);if(!o)return;const cells=tr.querySelectorAll('td');for(const cell of cells){if(/^free agent/i.test(cell.textContent.trim()))cell.textContent=(typeof franchiseLabel==='function'?franchiseLabel(o.fid):o.fid);}});
    if(typeof filterPlayers==='function')filterPlayers();
  }
  function renderPlayerHeader(){
    if(!live?.ok||!seasonIsLive())return;
    const parts=location.hash.replace(/^#/,'').split('/');if(parts[0]!=='player'||!parts[1])return;
    const p=(typeof DB!=='undefined'&&DB?.Players||[]).find(x=>x.Player_ID===parts[1]);if(!p)return;
    const units=liveContractUnitsForPlayer(p.Player_Name);if(units==null)return;
    const badge=document.querySelector('.player-command .base-salary-badge');if(badge)badge.textContent=units+' Unit'+(units===1?'':'s');
    const contract=document.getElementById('playerContractUnits');if(contract)contract.textContent=String(units);
  }
  function render(){
    const apply=()=>{renderCap();renderOverviewKpis();renderPicks();renderPlayerHeader();renderFreeAgencyOwnership();};
    setTimeout(apply,80);setTimeout(apply,250);setTimeout(apply,700);
  }
  async function refresh(){try{const response=await fetch(`${ENDPOINT}?refresh=${Date.now()}`,{cache:'no-store'}),data=await response.json();if(response.ok&&data?.ok&&data?.season&&data?.teams){live=data;window.DYNASTY_LIVE_SHEET=data;ensureSeasonOption();render();}else console.info('Dynasty live sheet fallback active:',data?.message||response.status);}catch(err){console.info('Dynasty live sheet fallback active:',err?.message||err);}}
  window.addEventListener('hashchange',render);document.getElementById('seasonSelect')?.addEventListener('change',render);refresh();setInterval(refresh,REFRESH_MS);
})();
