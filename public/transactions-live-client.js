// Live Google Sheet transaction overlay. Existing DB remains the fallback.
(function(){
  const newsStyle=document.createElement('style');
  newsStyle.textContent='.league-news .news-live-item{grid-template-columns:42px minmax(0,1fr) minmax(0,1fr);gap:10px}.league-news .news-live-item>div{min-width:0;overflow-wrap:anywhere}.league-news .news-contract small{margin-top:0}';
  document.head.appendChild(newsStyle);
  const ENDPOINT='/api/transactions-live';
  const REFRESH_MS=10*60*1000;
  const FID_OWNER={F01:'Andrew',F02:'Brandon',F03:'Jake',F04:'Jordan',F05:'Derek',F06:'J&J',F07:'Diaz',F08:'Tom',F09:'Nate',F10:'Seth'};
  let live=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const routeParts=()=>location.hash.replace(/^#/,'').split('/');
  const pillClass=type=>{
    const t=String(type||'').toLowerCase();
    if(t.includes('trade')) return 'trade';
    if(t.includes('add')||t.includes('sign')||t.includes('claim')) return 'add';
    if(t.includes('drop')||t.includes('waiv')||t.includes('release')) return 'drop';
    return 'other';
  };
  function table(rows){
    return `<div class="table-wrap"><table class="data-table transactions-live-table"><thead><tr><th>Date</th><th>Team</th><th>Move</th><th>Player / Asset</th><th>Transaction Details</th></tr></thead><tbody>${rows.map(x=>`<tr><td class="tx-date">${esc(x.date||'—')}</td><td class="tx-team"><b>${esc(x.team)}</b></td><td><span class="tx-pill ${pillClass(x.type)}">${esc(x.type)}</span></td><td class="tx-asset">${esc(x.asset)}</td><td class="tx-details">${esc(x.details||'')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderHome(){
    if(!live?.ok)return;
    const card=document.querySelector('#app .league-news');
    if(!card)return;
    // The master sheet keeps newest moves first, including same-day entries.
    const rows=(live.transactions||[]).slice(0,4);
    const label=card.querySelector('.section-title > span');
    if(label)label.textContent='Latest Sheet Activity';
    const list=card.querySelector('.news-list');
    if(list)list.innerHTML=rows.length?rows.map(x=>`<div class="news-item news-live-item"><div class="news-date">${esc(x.date||'—')}</div><div><b>${esc(x.type||'League Move')}</b><small>${esc(x.team)} · ${esc(x.asset)}</small></div><div class="news-contract">${x.details?`<small>${esc(x.details)}</small>`:''}</div></div>`).join(''):`<div class="empty">No ${esc(live.displaySeason)} transactions are currently listed in the Google Sheet.</div>`;
  }
  // Reapply after every homepage render, including asynchronous standings updates.
  const originalHome=window.home;
  window.home=function(){const result=originalHome.apply(this,arguments);renderHome();return result;};
  function renderLeague(){
    if(!live?.ok)return;
    const p=routeParts();
    if(p[0]!=='transactions')return;
    const app=document.getElementById('app'); if(!app)return;
    const rows=live.transactions||[];
    app.innerHTML=`<section class="page-head"><div class="eyebrow">Dynasty NBA · ${live.displaySeason}</div><h1>Transactions</h1><p>Live league transaction log from the master Google Sheet.</p></section><div class="content"><section class="card transactions-live-card"><div class="card-pad section-title"><h2>${live.displaySeason} TRANSACTION LOG</h2><span>${rows.length} recorded moves · refreshes every 10 minutes</span></div>${rows.length?table(rows):'<div class="empty">No transactions are currently listed in the Google Sheet.</div>'}</section></div>`;
    if(typeof setActive==='function')setActive();
  }
  function renderTeam(){
    if(!live?.ok)return;
    const p=routeParts();
    if(p[0]!=='team'||p[2]!=='transactions'||!FID_OWNER[p[1]])return;
    const tabs=document.querySelector('#app .team-tabs'); if(!tabs)return;
    const owner=FID_OWNER[p[1]];
    const rows=(live.transactions||[]).filter(x=>String(x.team).trim().toLowerCase()===owner.toLowerCase());
    let holder=document.querySelector('#app .transactions-live-team');
    if(!holder){
      holder=document.createElement('div'); holder.className='transactions-live-team';
      while(tabs.nextSibling) tabs.parentNode.removeChild(tabs.nextSibling);
      tabs.parentNode.appendChild(holder);
    }
    holder.innerHTML=`<section class="card transactions-live-card"><div class="card-pad section-title"><h2>${esc(owner.toUpperCase())} TRANSACTIONS</h2><span>${rows.length} current-season moves · live from Google Sheet</span></div>${rows.length?table(rows):'<div class="empty">No current-season transactions are listed for this team.</div>'}</section>`;
  }
  function renderAll(){setTimeout(()=>{renderHome();renderLeague();renderTeam();},90);}
  async function refresh(){
    try{
      const response=await fetch(`${ENDPOINT}?refresh=${Date.now()}`,{cache:'no-store'});
      const data=await response.json();
      if(response.ok&&data?.ok){live=data;window.DYNASTY_TRANSACTIONS_LIVE=data;renderAll();}
      else console.info('Transaction live fallback active:',data?.message||response.status);
    }catch(err){console.info('Transaction live fallback active:',err?.message||err);}
  }
  window.addEventListener('hashchange',renderAll);
  refresh();
  setInterval(refresh,REFRESH_MS);
})();
