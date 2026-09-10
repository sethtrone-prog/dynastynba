// Live Wins Pool overlay. Static workbook-derived pages remain the fallback.
(function(){
  const ENDPOINT='/api/wins-pool-live';
  const REFRESH_MS=10*60*1000;
  const FID_OWNER={F01:'Andrew',F02:'Brandon',F03:'Jake',F04:'Jordan',F05:'Derek',F06:'J&J',F07:'Diaz',F08:'Tom',F09:'Nate',F10:'Seth'};
  let live=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>v==null?'—':Number(v).toFixed(1).replace(/\.0$/,'');
  const signed=v=>v==null?'—':`${v>0?'+':''}${Number(v).toFixed(1)}`;
  const perfClass=v=>v==null?'':(v>0?'positive':v<0?'negative':'neutral');
  const ord=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
  const routeParts=()=>location.hash.replace(/^#/,'').split('/');

  function renderLeague(){
    if(!live?.ok)return;
    const p=routeParts();
    if(p[0]!=='wins-pool')return;
    const app=document.getElementById('app');
    if(!app)return;
    const owners=live.owners||[];
    const standings=live.standings||[];
    const draft=live.draft||[];
    const slotOrder=live.slotOrder||[];

    app.innerHTML=`<section class="page-head"><div class="eyebrow">Dynasty NBA · ${live.displaySeason}</div><h1>Wins Pool</h1><p>Current-year Wins Pool standings and selection board from the live master Google Sheet.</p></section><div class="content wins-pool-live-page">
      <section class="card wins-pool-standings-card"><div class="card-pad section-title"><h2>${live.displaySeason} WINS POOL STANDINGS</h2><span>Highest total earns the first base free-agency position</span></div><div class="table-wrap"><table class="data-table wins-pool-standings-table"><thead><tr><th>#</th><th>Owner</th><th>Total</th><th>Projected</th><th>Preseason Total</th><th>Vs. Preseason</th><th>Games Remaining</th></tr></thead><tbody>${standings.map(x=>{const delta=x.projected==null||x.preseason==null?null:x.projected-x.preseason;return `<tr class="standing-row standing-${x.position}"><td class="rank"><span class="rank-badge">${x.position}</span></td><td><b>${esc(x.owner)}</b></td><td class="record pool-total">${num(x.total)}</td><td>${num(x.projected)}</td><td>${num(x.preseason)}</td><td class="performance ${perfClass(delta)}">${signed(delta)}</td><td>${num(x.remaining)}</td></tr>`;}).join('')}</tbody></table></div></section>
      <section class="card owner-selections-card"><div class="card-pad section-title"><h2>OWNER SELECTIONS</h2><span>Three NBA teams per owner</span></div><div class="table-wrap"><table class="data-table owner-selections-table"><thead><tr><th>Owner</th><th>Pick</th><th>NBA Team</th><th>W-L</th><th>Projected Wins</th><th>Preseason O/U</th><th>Diff</th></tr></thead><tbody>${owners.map(x=>(x.teams||[]).map((t,i)=>`<tr class="owner-group ${i===0?'owner-group-start':''}">${i===0?`<td rowspan="${x.teams.length}" class="owner-summary"><b>${esc(x.owner)}</b><small>${num(x.total)} total wins</small></td>`:''}<td class="selection-pick"><span>${num(t.pick)}</span></td><td class="selection-team"><b>${esc(t.team)}</b></td><td class="record">${num(t.wins)}-${num(t.losses)}</td><td>${num(t.projected)}</td><td>${num(t.preseasonOU)}</td><td class="performance ${perfClass(t.diff)}">${signed(t.diff)}</td></tr>`).join('')).join('')}</tbody></table></div></section>
      <div class="grid"><section class="card span-8"><div class="card-pad section-title"><h2>NBA TEAM SELECTION DRAFT</h2><span>All ${draft.length} selections</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Pick</th><th>Owner</th><th>NBA Team</th></tr></thead><tbody>${draft.map(x=>`<tr><td class="rank">${num(x.pick)}</td><td>${esc(x.owner)}</td><td><b>${esc(x.team)}</b></td></tr>`).join('')}</tbody></table></div></section><section class="card span-4"><div class="card-pad section-title"><h2>SLOT SELECTION ORDER</h2><span>${live.displaySeason} setup order</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Owner</th></tr></thead><tbody>${slotOrder.map(x=>`<tr><td class="rank">${num(x.position)}</td><td><b>${esc(x.owner)}</b></td></tr>`).join('')}</tbody></table></div></section></div>
      <section class="card"><div class="card-pad"><p><small>Live source: Dynasty League ${live.displaySeason} master Google Sheet — Wins Pool. Data refreshes automatically every 10 minutes while the site is open.</small></p></div></section>
    </div>`;
    if(typeof setActive==='function')setActive();
  }

  function rankForOwner(owner){
    const totals=(live?.owners||[]).map(x=>x.total).filter(v=>v!=null);
    const row=(live?.owners||[]).find(x=>x.owner===owner);
    if(!row||row.total==null)return null;
    const rankNum=1+totals.filter(v=>v>row.total).length;
    const tied=totals.filter(v=>v===row.total).length>1;
    return {rankNum,rank:tied?`T-${rankNum}`:String(rankNum)};
  }

  function parseHistoryTable(){
    const table=document.querySelector('.wins-pool-content table.data-table');
    if(!table)return [];
    return [...table.querySelectorAll('tbody tr')].map(tr=>{
      const c=tr.querySelectorAll('td');
      if(c.length<5)return null;
      const year=Number(c[0].textContent.trim());
      const owner=c[1].textContent.trim();
      const wins=Number(c[2].textContent.trim());
      const rankText=c[3].textContent.trim();
      const rankNum=Number((rankText.match(/\d+/)||[])[0]);
      return Number.isFinite(year)&&Number.isFinite(wins)&&Number.isFinite(rankNum)?{year,owner,wins,rankNum,rank:rankText}:null;
    }).filter(Boolean);
  }

  function drawTeam(holder,rows){
    rows=rows.slice().sort((a,b)=>b.year-a.year);
    const total=rows.reduce((s,x)=>s+x.wins,0),avg=total/rows.length,firsts=rows.filter(x=>x.rankNum===1).length,avgFinish=rows.reduce((s,x)=>s+x.rankNum,0)/rows.length;
    const best=rows.slice().sort((a,b)=>a.rankNum-b.rankNum||b.wins-a.wins)[0];
    const most=rows.slice().sort((a,b)=>b.wins-a.wins)[0];
    const worst=rows.slice().sort((a,b)=>b.rankNum-a.rankNum||a.wins-b.wins)[0];
    holder.innerHTML=`<section class="card"><div class="card-pad section-title"><h2>WINS POOL</h2><span>Historical Free Agency Order</span></div><div class="card-pad"><p>The Wins Pool uses the three NBA teams selected by each owner. Their combined wins determine the base free agency draft order, with the highest total finishing first.</p></div></section><div class="team-kpi-row"><div><b>${total}</b><span>Total Pool Wins</span></div><div><b>${avg.toFixed(1)}</b><span>Avg. Pool Wins</span></div><div><b>${firsts}</b><span>#1 Finishes</span></div><div><b>${avgFinish.toFixed(1)}</b><span>Avg. Finish</span></div></div><section class="card"><div class="card-pad section-title"><h2>HISTORICAL WINS POOL RESULTS</h2><span>2020–${live.historyYear} · newest season live from Google Sheet</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Season</th><th>Owner</th><th>Pool Wins</th><th>Finish</th><th>Base FA Position</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${x.year}</b></td><td>${esc(x.owner)}</td><td>${num(x.wins)}</td><td class="rank">${esc(x.rank)}</td><td>${x.rank.startsWith('T-')?esc(x.rank):ord(x.rankNum)}</td></tr>`).join('')}</tbody></table></div></section><div class="grid"><section class="card span-4"><div class="card-pad section-title"><h2>BEST FINISH</h2></div><div class="card-pad"><h2>${esc(best.rank)}</h2><p>${best.year} · ${num(best.wins)} pool wins.</p></div></section><section class="card span-4"><div class="card-pad section-title"><h2>MOST POOL WINS</h2></div><div class="card-pad"><h2>${num(most.wins)}</h2><p>${most.year} · ${esc(most.rank)} finish.</p></div></section><section class="card span-4"><div class="card-pad section-title"><h2>LOWEST FINISH</h2></div><div class="card-pad"><h2>${esc(worst.rank)}</h2><p>${worst.year} · ${num(worst.wins)} pool wins.</p></div></section></div><section class="card"><div class="card-pad"><p><small>2020–2025 remain archived from the historical workbooks. ${live.historyYear} is supplied by the current master Google Sheet and refreshes automatically every 10 minutes.</small></p></div></section>`;
  }

  function renderTeam(){
    if(!live?.ok)return;
    const p=routeParts();
    if(p[0]!=='team'||p[2]!=='wins-pool'||!FID_OWNER[p[1]])return;
    const holder=document.querySelector('.wins-pool-content');
    if(!holder)return;
    const owner=FID_OWNER[p[1]];
    const current=(live.owners||[]).find(x=>x.owner===owner);
    const rank=rankForOwner(owner);
    if(!current||!rank)return;
    let rows=parseHistoryTable();
    if(!rows.length)return;
    rows=rows.filter(x=>x.year!==live.historyYear);
    rows.push({year:live.historyYear,owner,wins:current.total,rankNum:rank.rankNum,rank:rank.rank});
    drawTeam(holder,rows);
  }

  function renderAll(){setTimeout(()=>{renderLeague();renderTeam();},90);}
  async function refresh(){
    try{
      const response=await fetch(`${ENDPOINT}?refresh=${Date.now()}`,{cache:'no-store'});
      const data=await response.json();
      if(response.ok&&data?.ok){live=data;window.DYNASTY_WINS_POOL_LIVE=data;renderAll();}
      else console.info('Wins Pool live fallback active:',data?.message||response.status);
    }catch(err){console.info('Wins Pool live fallback active:',err?.message||err);}
  }

  window.addEventListener('hashchange',renderAll);
  refresh();
  setInterval(refresh,REFRESH_MS);
})();
