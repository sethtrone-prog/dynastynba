// Live Google Sheet transaction overlay. Existing DB remains the fallback.
(function(){
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
  function renderAll(){setTimeout(()=>{renderLeague();renderTeam();},90);}
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
