// Current-season Wins Pool page sourced from Dynasty League 2027 workbook -> Wins Pool / Wins Pool Standings.
(function(){
  const OWNER_ROWS=[
    {owner:'Jake',total:129,projected:128.904,remaining:0,pre:120.5,teams:[{pick:1,team:'Thunder',wins:64,losses:18,proj:63.96,ou:62.5,diff:1.46},{pick:20,team:'Heat',wins:43,losses:39,proj:42.968,ou:38.5,diff:4.468},{pick:30,team:'Jazz',wins:22,losses:60,proj:21.976,ou:19.5,diff:2.476}]},
    {owner:'Brandon',total:79,projected:78.966,remaining:0,pre:102.5,teams:[{pick:2,team:'Warriors',wins:37,losses:45,proj:36.982,ou:47.5,diff:-10.518},{pick:19,team:'Kings',wins:22,losses:60,proj:21.976,ou:35.5,diff:-13.524},{pick:29,team:'Nets',wins:20,losses:62,proj:20.008,ou:19.5,diff:.508}]},
    {owner:'Nate',total:95,projected:94.956,remaining:0,pre:117.5,teams:[{pick:3,team:'Cavaliers',wins:52,losses:30,proj:51.988,ou:56.5,diff:-4.512},{pick:16,team:'Mavericks',wins:26,losses:56,proj:25.994,ou:40.5,diff:-14.506},{pick:28,team:'Wizards',wins:17,losses:65,proj:16.974,ou:20.5,diff:-3.526}]},
    {owner:'Seth',total:144,projected:144.074,remaining:0,pre:127.5,teams:[{pick:4,team:'Nuggets',wins:54,losses:28,proj:54.038,ou:53.5,diff:.538},{pick:17,team:'76ers',wins:45,losses:37,proj:45.018,ou:42.5,diff:2.518},{pick:27,team:'Suns',wins:45,losses:37,proj:45.018,ou:31.5,diff:13.518}]},
    {owner:'Derek',total:111,projected:110.946,remaining:0,pre:125.5,teams:[{pick:5,team:'Knicks',wins:53,losses:29,proj:52.972,ou:52.5,diff:.472},{pick:15,team:'Bucks',wins:32,losses:50,proj:31.98,ou:42.5,diff:-10.52},{pick:26,team:'Pelicans',wins:26,losses:56,proj:25.994,ou:30.5,diff:-4.506}]},
    {owner:'J&J',total:149,projected:148.994,remaining:0,pre:126.5,teams:[{pick:6,team:'Rockets',wins:52,losses:30,proj:51.988,ou:52.5,diff:-.512},{pick:13,team:'Lakers',wins:53,losses:29,proj:52.972,ou:47.5,diff:5.472},{pick:24,team:'Hornets',wins:44,losses:38,proj:44.034,ou:26.5,diff:17.534}]},
    {owner:'Andrew',total:129,projected:128.986,remaining:0,pre:134.5,teams:[{pick:7,team:'Magic',wins:45,losses:37,proj:45.018,ou:50.5,diff:-5.482},{pick:11,team:'Clippers',wins:42,losses:40,proj:41.984,ou:49.5,diff:-7.516},{pick:25,team:'Blazers',wins:42,losses:40,proj:41.984,ou:34.5,diff:7.484}]},
    {owner:'Jordan',total:120,projected:120.048,remaining:0,pre:128.5,teams:[{pick:8,team:'Timberwolves',wins:49,losses:33,proj:49.036,ou:49.5,diff:-.464},{pick:18,team:'Grizzlies',wins:25,losses:57,proj:25.01,ou:39.5,diff:-14.49},{pick:21,team:'Raptors',wins:46,losses:36,proj:46.002,ou:39.5,diff:6.502}]},
    {owner:'Diaz',total:133,projected:133.004,remaining:0,pre:122.5,teams:[{pick:9,team:'Hawks',wins:46,losses:36,proj:46.002,ou:47.5,diff:-1.498},{pick:14,team:'Celtics',wins:56,losses:26,proj:56.006,ou:42.5,diff:13.506},{pick:23,team:'Bulls',wins:31,losses:51,proj:30.996,ou:32.5,diff:-1.504}]},
    {owner:'Tom',total:141,projected:141.04,remaining:0,pre:126.5,teams:[{pick:10,team:'Pistons',wins:60,losses:22,proj:60.024,ou:46.5,diff:13.524},{pick:12,team:'Spurs',wins:62,losses:20,proj:61.992,ou:43.5,diff:18.492},{pick:22,team:'Pacers',wins:19,losses:63,proj:19.024,ou:36.5,diff:-17.476}]}
  ];
  const STANDINGS=['J&J','Seth','Tom','Diaz','Andrew','Jake','Jordan','Derek','Nate','Brandon'];
  const SLOT_ORDER=['Jake','Tom','Jordan','J&J','Andrew','Seth','Nate','Derek','Diaz','Brandon'];
  const DRAFT=[
    [1,'Jake','Thunder'],[2,'Brandon','Warriors'],[3,'Nate','Cavaliers'],[4,'Seth','Nuggets'],[5,'Derek','Knicks'],[6,'J&J','Rockets'],[7,'Andrew','Magic'],[8,'Jordan','Timberwolves'],[9,'Diaz','Hawks'],[10,'Tom','Pistons'],[11,'Andrew','Clippers'],[12,'Tom','Spurs'],[13,'J&J','Lakers'],[14,'Diaz','Celtics'],[15,'Derek','Bucks'],[16,'Nate','Mavericks'],[17,'Seth','76ers'],[18,'Jordan','Grizzlies'],[19,'Brandon','Kings'],[20,'Jake','Heat'],[21,'Jordan','Raptors'],[22,'Tom','Pacers'],[23,'Diaz','Bulls'],[24,'J&J','Hornets'],[25,'Andrew','Blazers'],[26,'Derek','Pelicans'],[27,'Seth','Suns'],[28,'Nate','Wizards'],[29,'Brandon','Nets'],[30,'Jake','Jazz']
  ];
  const byOwner=o=>OWNER_ROWS.find(x=>x.owner===o);
  const num=v=>Number(v).toFixed(1).replace(/\.0$/,'');
  const signed=v=>`${v>0?'+':''}${Number(v).toFixed(1)}`;
  function ensureNav(){
    const nav=document.getElementById('mainNav'); if(!nav||nav.querySelector('[data-route="wins-pool"]'))return;
    const b=document.createElement('button');b.dataset.route='wins-pool';b.textContent='WINS POOL';b.onclick=()=>{go('wins-pool');nav.classList.remove('open')};
    const standings=nav.querySelector('[data-route="standings"]'); standings?standings.after(b):nav.appendChild(b);
  }
  function draw(){
    const app=document.getElementById('app');if(!app)return;
    const standings=STANDINGS.map((o,i)=>({...byOwner(o),pos:i+1}));
    app.innerHTML=`<section class="page-head"><div class="eyebrow">Dynasty NBA · 2027</div><h1>Wins Pool</h1><p>Current-year Wins Pool standings and selection board from the 2027 league workbook.</p></section><div class="content">
      <section class="card"><div class="card-pad section-title"><h2>2027 WINS POOL STANDINGS</h2><span>Highest total earns the first base free-agency position</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Owner</th><th>Total</th><th>Projected</th><th>Preseason Total</th><th>Vs. Preseason</th><th>Games Remaining</th></tr></thead><tbody>${standings.map(x=>`<tr><td class="rank">${x.pos}</td><td><b>${x.owner}</b></td><td class="record">${x.total}</td><td>${num(x.projected)}</td><td>${num(x.pre)}</td><td>${signed(x.projected-x.pre)}</td><td>${x.remaining}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="card"><div class="card-pad section-title"><h2>OWNER SELECTIONS</h2><span>Three NBA teams per owner</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Owner</th><th>Pick</th><th>NBA Team</th><th>W-L</th><th>Projected Wins</th><th>Preseason O/U</th><th>Diff</th></tr></thead><tbody>${OWNER_ROWS.map(x=>x.teams.map((t,i)=>`<tr>${i===0?`<td rowspan="3"><b>${x.owner}</b><br><small>${x.total} total wins</small></td>`:''}<td>${t.pick}</td><td><b>${t.team}</b></td><td class="record">${t.wins}-${t.losses}</td><td>${num(t.proj)}</td><td>${num(t.ou)}</td><td>${signed(t.diff)}</td></tr>`).join('')).join('')}</tbody></table></div></section>
      <div class="grid"><section class="card span-8"><div class="card-pad section-title"><h2>NBA TEAM SELECTION DRAFT</h2><span>All 30 selections</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Pick</th><th>Owner</th><th>NBA Team</th></tr></thead><tbody>${DRAFT.map(x=>`<tr><td class="rank">${x[0]}</td><td>${x[1]}</td><td><b>${x[2]}</b></td></tr>`).join('')}</tbody></table></div></section><section class="card span-4"><div class="card-pad section-title"><h2>SLOT SELECTION ORDER</h2><span>2027 setup order</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Owner</th></tr></thead><tbody>${SLOT_ORDER.map((o,i)=>`<tr><td class="rank">${i+1}</td><td><b>${o}</b></td></tr>`).join('')}</tbody></table></div></section></div>
      <section class="card"><div class="card-pad"><p><small>Source: Dynasty League 2027 workbook — Wins Pool and Wins Pool Standings tabs. The current workbook shows zero games remaining, so the displayed totals reflect the completed standings currently stored in that sheet.</small></p></div></section>
    </div>`;
    if(typeof setActive==='function')setActive();ensureNav();
  }
  ensureNav();
  if(typeof render==='function'){
    const original=render;
    render=function(){if(String(route||'').split('/')[0]==='wins-pool'){draw();return;}original();ensureNav();};
  }
  window.addEventListener('hashchange',()=>{ensureNav();if(location.hash.replace(/^#/,'').split('/')[0]==='wins-pool')setTimeout(draw,0)});
  setTimeout(()=>{ensureNav();if(location.hash.replace(/^#/,'').split('/')[0]==='wins-pool')draw();},150);
})();
