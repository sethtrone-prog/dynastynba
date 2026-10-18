// One History subheader shared by all four history sections.
(function(){
  const selections=[['history','League History'],['history/playoffs','Playoff History'],['statistics','Player Statistics'],['history/performances','Top Performances']];
  const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let performanceRequest=null;
  function historyNavigation(){
    const active=String(route||'');if(!selections.some(([key])=>key===active))return;
    const app=document.getElementById('app');if(!app)return;
    app.querySelectorAll('.history-subnav,.history-subtabs,.history-sections').forEach(e=>e.remove());
    const nav=document.createElement('nav');nav.className='history-sections resource-tabs';nav.setAttribute('aria-label','History sections');
    nav.innerHTML=selections.map(([key,label])=>`<button type="button" data-history-route="${key}" class="${key===active?'active':''}" ${key===active?'aria-current="page"':''}>${label}</button>`).join('');
    nav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.historyRoute)));
    const content=app.querySelector('.content');if(content)content.prepend(nav);else app.prepend(nav);
    document.querySelectorAll('#mainNav [data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route==='history'));
  }
  async function performances(){
    layout('History','The highest-scoring individual NBA games under Dynasty NBA’s fantasy scoring rules.','<div id="topPerformancesRoot"><div class="card"><div class="empty">Loading Top Performances…</div></div></div>');
    const root=document.getElementById('topPerformancesRoot');
    try{
      if(!performanceRequest)performanceRequest=fetch('/data/top-performances.json').then(r=>{if(!r.ok)throw new Error('Unavailable');return r.json();}).catch(e=>{performanceRequest=null;throw e;});
      const data=await performanceRequest;if(!root.isConnected)return;
      root.innerHTML=`<div class="team-subhead"><div><div class="eyebrow">INDIVIDUAL GAME RECORDS</div><h2>Top 50 Performances</h2></div></div><section class="card"><div class="table-wrap"><table class="data-table performance-table"><thead><tr><th>Rank</th><th>Player</th><th>Fantasy Pts</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TO</th><th>FG</th><th>FT</th><th>Matchup</th><th>Date</th></tr></thead><tbody>${data.games.map(g=>`<tr><td class="rank">${g.rank}</td><td><b>${html(g.name)}</b></td><td class="performance-fantasy">${Number(g.fantasy).toFixed(2)}</td><td>${g.points}</td><td>${g.rebounds_total}</td><td>${g.assists}</td><td>${g.steals}</td><td>${g.blocks}</td><td>${g.turnovers}</td><td>${g.field_goals_made}/${g.field_goals_attempted}</td><td>${g.free_throws_made}/${g.free_throws_attempted}</td><td>${html(g.matchup)}</td><td><a href="${html(g.sourceUrl||'https://www.nba.com/game/'+encodeURIComponent(g.game_id)+'/box-score')}" target="_blank" rel="noopener noreferrer" aria-label="${html(g.name)} box score ${html(g.game_date)}">${html(g.game_date)}</a></td></tr>`).join('')}</tbody></table></div></section><p class="note">${html(data.formula)}. Tied scores share a rank; NBA points break display-order ties. Dates link to NBA box scores.</p><p class="note">Updated daily from completed regular-season games. Last successful update: ${html(data.checkedThrough||'pending')}. Ranked from ${Number(data.playerBoxScoresReviewed).toLocaleString()} player box-score entries. These performances have not been verified against fantasy starting lineups.</p>`;
    }catch(e){if(root.isConnected)root.innerHTML='<div class="card"><div class="empty">Top Performances could not load. Please refresh to try again.</div></div>';}
  }
  if(typeof render==='function'){
    const original=render;
    render=function(){
      if(String(route||'')==='history/performances')performances();else original.apply(this,arguments);
      historyNavigation();
    };
  }
  const style=document.createElement('style');style.textContent='.history-sections{height:auto;max-height:none;overflow:visible}.performance-table .rank{color:#d9a93b;font-weight:800}.performance-table{min-width:1050px}.performance-table th,.performance-table td{white-space:nowrap}.performance-table th:nth-child(n+3):nth-child(-n+11),.performance-table td:nth-child(n+3):nth-child(-n+11){text-align:center}.performance-table .performance-fantasy{color:#d9a93b;font-weight:800}.performance-table a{color:#9ac9eb}';document.head.appendChild(style);
})();
