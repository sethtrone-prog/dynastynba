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
    const rows=(live.transactions||[]).slice(0,5);
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
  function renderTeamOverview(){
    if(!live?.ok)return;
    const p=routeParts();
    if(p[0]!=='team'||(p[2]&&p[2]!=='overview')||!FID_OWNER[p[1]])return;
    const feed=document.querySelector('#app .transaction-feed.compact');
    if(!feed)return;
    const owner=FID_OWNER[p[1]];
    const rows=(live.transactions||[]).filter(x=>String(x.team).trim().toLowerCase()===owner.toLowerCase()).slice(0,8);
    feed.innerHTML=rows.map(x=>`<div class="transaction-row"><time>${esc(x.date||'—')}</time><span class="move-badge">${esc(x.type)}</span><div><b>${typeof playerLink==='function'?playerLink(x.asset,'transaction-player-link'):esc(x.asset)}</b><p>${esc(x.details||'')}</p></div></div>`).join('')||`<div class="empty">No ${esc(live.displaySeason)} transactions are currently listed for this team in the Google Sheet.</div>`;
  }
  const originalTeamPage=window.teamPage;
  window.teamPage=function(){const result=originalTeamPage.apply(this,arguments);renderTeamOverview();return result;};
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

  // Join the current ledger to the archive without changing DB.Transactions.
  const trailNorm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'`]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const trailName=v=>trailNorm(v).replace(/\s+(jr|sr|ii|iii|iv)$/,'');
  function trailDate(value,endYear){
    const s=String(value||'').trim();
    if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
    const m=s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if(!m)return '';
    const year=m[3]?(Number(m[3])<100?2000+Number(m[3]):Number(m[3])):Number(endYear)-(Number(m[1])>=7?1:0);
    return `${year}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  }
  function playerTrail(p,archive,feed,players){
    const name=trailName(p.Player_Name);
    // Only relax suffixes when the resulting name identifies one player.
    const unique=players.filter(x=>trailName(x.Player_Name)===name).length===1;
    const matches=value=>{
      const text=trailNorm(value),full=trailNorm(p.Player_Name);
      return !!full&&(` ${text} `.includes(` ${full} `)||(unique&&name&&` ${text} `.includes(` ${name} `)));
    };
    const fidFor=team=>Object.keys(FID_OWNER).find(fid=>trailNorm(team)===trailNorm(FID_OWNER[fid])||trailNorm(team)===trailNorm(franchise(fid).Current_Owner)||trailNorm(team)===trailNorm(ownerForSeason(fid,feed?.displaySeason)))||'';
    const old=archive.map((x,i)=>({date:trailDate(txDate(x),yearOf(x)),season:yearOf(x),team:x.Team_Raw||x.Team||ownerName(x.Owner_ID),fid:x.Franchise_ID||'',type:txMove(x),asset:txAsset(x),details:x.Details||'',index:i}));
    const fresh=feed?.ok?(feed.transactions||[]).map((x,i)=>({...x,date:trailDate(x.date,feed.displaySeason),season:Number(feed.displaySeason),fid:fidFor(x.team),index:i})):[];
    const key=x=>JSON.stringify([x.season,x.date,x.fid||trailNorm(x.team),trailNorm(x.type),trailNorm(x.asset)]);
    // Match occurrences across sources; retain separate same-day moves within either source.
    const overlap=new Map();fresh.forEach(x=>overlap.set(key(x),(overlap.get(key(x))||0)+1));
    const retained=old.filter(x=>{const k=key(x),n=overlap.get(k)||0;if(n){overlap.set(k,n-1);return false}return true});
    return fresh.concat(retained).filter(x=>matches(x.asset)||matches(x.details)).sort((a,b)=>b.season-a.season||String(b.date).localeCompare(String(a.date)));
  }
  function renderPlayerTrail(){
    const parts=routeParts();if(parts[0]!=='player'||typeof DB==='undefined'||!DB)return;
    const p=player(decodeURIComponent(parts[1]||''));if(!p?.Player_Name)return;
    const panel=[...document.querySelectorAll('#app .player-panel')].find(x=>x.querySelector('.eyebrow')?.textContent.trim()==='TRANSACTION TRAIL');
    if(!panel)return;
    const rows=playerTrail(p,DB.Transactions||[],live,DB.Players||[]);
    const count=panel.querySelector('.section-title > span');if(count)count.textContent=`${rows.length} matches`;
    const feed=panel.querySelector('.transaction-feed');if(!feed)return;
    feed.innerHTML=rows.map(x=>`<div class="transaction-row"><time>${esc(x.date||'—')}</time><span class="move-badge">${esc(x.type)}</span><div><b>${esc(x.asset||'League move')}</b><p>${esc(x.details)}</p>${x.fid?`<button class="inline-link" onclick="go('team/${x.fid}/transactions')">${esc(x.team||franchiseLabel(x.fid))}</button>`:`<small>${esc(x.team||'')}</small>`}</div></div>`).join('')||'<div class="empty">No transaction rows matched this player name.</div>';
  }
  const originalPlayerPage=window.playerPage;
  window.playerPage=function(){const result=originalPlayerPage.apply(this,arguments);renderPlayerTrail();return result;};

  function renderAll(){setTimeout(()=>{renderHome();renderLeague();renderTeamOverview();renderTeam();renderPlayerTrail();},90);}
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
