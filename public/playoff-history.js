// Audited ESPN playoff history, 2019-2026.
// Champion/runner-up/other playoff teams are based on ESPN finalStanding and winners-bracket results.
(function(){
  const PLAYOFF_HISTORY=[
    {season:2019,champion:'Jacob Thompson',championTeam:'Longer Than Most',runner:'Jordan Winters',runnerTeam:'Team Winters',third:'Seth Trone',thirdTeam:'Bug on muh Putta',fourth:'Andrew Thompson',fourthTeam:'Tiger Isn’t Scratch'},
    {season:2020,champion:'Seth Trone',championTeam:'Seventy Suxers',runner:'Jacob Thompson',runnerTeam:'Longer Than Most',third:'Brandon Caiola',thirdTeam:'Team Caiola',fourth:'Kyle Van Duyne',fourthTeam:'Team Linsane In The Membrane',note:'ESPN final standings are preserved; archived playoff matchup scores are recorded as 0.'},
    {season:2021,champion:'Seth Trone',championTeam:'Seventy Suxers',runner:'Kyle Van Duyne',runnerTeam:'Team Linsane In The Membrane',third:'Nate Artz',thirdTeam:"Nartz N' Crafts",fourth:'Kyle Smith',fourthTeam:'The Replacements'},
    {season:2022,champion:'Seth Trone',championTeam:'Seventy Suxers',runner:'Brandon Caiola',runnerTeam:'A Tale of Two Bridges',third:'Nate Artz',thirdTeam:"Nartz N' Crafts",fourth:'Davis Jensen',fourthTeam:'Team Jensen'},
    {season:2023,champion:'Nate Artz',championTeam:"Nartz N' Crafts",runner:'Jacob Thompson',runnerTeam:'Longer Than Most',third:'Seth Trone',thirdTeam:'Seventy Suxers',fourth:'Justin Stanley & Jared Peterman',fourthTeam:'Big Face Coffee'},
    {season:2024,champion:'Brandon Caiola',championTeam:'Anotha One',runner:'Seth Trone',runnerTeam:'Seventy Suxers',third:'Nate Artz',thirdTeam:"Nartz N' Crafts",fourth:'Justin Diaz',fourthTeam:"John Chaney's Goon Squad"},
    {season:2025,champion:'Justin Diaz',championTeam:"John Chaney's Goon Squad",runner:'Derek Regar',runnerTeam:'The Gang Cops a Plea',third:'Nate Artz',thirdTeam:"Nartz N' Crafts",fourth:'Brandon Caiola',fourthTeam:'2 Nikolas 1 Jokic'},
    {season:2026,champion:'Andrew Thompson',championTeam:'Tiger Isn’t Scratch',runner:'Justin Diaz',runnerTeam:"John Chaney's Goon Squad",third:'Seth Trone',thirdTeam:'Seventy Suxers',fourth:'Derek Regar',fourthTeam:"Ayesha Curry's Coat Hanger"}
  ];
  const esc2=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function historyTabs(active){return `<div class="history-subtabs"><button class="${active==='archive'?'active':''}" onclick="go('history')">LEAGUE ARCHIVE</button><button class="${active==='playoffs'?'active':''}" onclick="go('history/playoffs')">PLAYOFF HISTORY</button></div>`}
  function playoffPage(){
    const cards=PLAYOFF_HISTORY.slice().reverse().map(x=>`<section class="playoff-season-card"><div class="playoff-season-year">${x.season}</div><div class="playoff-finish champion"><span>CHAMPION</span><b>${esc2(x.champion)}</b><small>${esc2(x.championTeam)}</small></div><div class="playoff-finish runner"><span>RUNNER-UP</span><b>${esc2(x.runner)}</b><small>${esc2(x.runnerTeam)}</small></div><div class="playoff-other"><div><span>PLAYOFF TEAM</span><b>${esc2(x.third)}</b><small>${esc2(x.thirdTeam)}</small></div><div><span>PLAYOFF TEAM</span><b>${esc2(x.fourth)}</b><small>${esc2(x.fourthTeam)}</small></div></div>${x.note?`<div class="playoff-note">${esc2(x.note)}</div>`:''}</section>`).join('');
    document.getElementById('app').innerHTML=`<section class="page-head"><div class="eyebrow">Dynasty NBA · Permanent Record</div><h1>History</h1><p>Champions, finalists, and every franchise that reached the four-team championship playoff.</p></section><div class="content">${historyTabs('playoffs')}<div class="playoff-history-list">${cards}</div></div>`;
    if(typeof setActive==='function')setActive();
  }
  function addArchiveTab(){
    const app=document.getElementById('app');if(!app||app.querySelector('.history-subtabs'))return;
    const content=app.querySelector('.content');if(content)content.insertAdjacentHTML('afterbegin',historyTabs('archive'));
  }
  const style=document.createElement('style');style.textContent=`.history-subtabs{display:flex;gap:8px;margin-bottom:18px}.history-subtabs button{background:#0b2744;color:#f3f7fb;border:1px solid #285b85;border-radius:5px;padding:12px 18px;font-weight:800;letter-spacing:.5px}.history-subtabs button.active{background:#d9a93b;color:#061323;border-color:#d9a93b}.playoff-history-list{display:grid;gap:14px}.playoff-season-card{display:grid;grid-template-columns:90px minmax(0,1.15fr) minmax(0,1.15fr) minmax(0,1.7fr);align-items:stretch;background:linear-gradient(135deg,#0a1f34,#0c263f);border:1px solid #244765;border-radius:9px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.18)}.playoff-season-year{display:flex;align-items:center;justify-content:center;font-family:Oswald,sans-serif;font-size:28px;font-weight:800;color:#d9a93b;border-right:1px solid rgba(217,169,59,.35)}.playoff-finish{padding:18px 20px;border-right:1px solid rgba(255,255,255,.09);display:flex;flex-direction:column;justify-content:center}.playoff-finish span,.playoff-other span{font-size:11px;font-weight:800;letter-spacing:1px;color:#9eb2c5;margin-bottom:5px}.playoff-finish.champion span{color:#d9a93b}.playoff-finish b,.playoff-other b{font-size:16px;color:#f3f7fb}.playoff-finish small,.playoff-other small{margin-top:4px;color:#9eb2c5;line-height:1.3}.playoff-other{display:grid;grid-template-columns:1fr 1fr}.playoff-other>div{padding:18px 20px;display:flex;flex-direction:column;justify-content:center}.playoff-other>div+div{border-left:1px solid rgba(255,255,255,.09)}.playoff-note{grid-column:1/-1;padding:8px 18px;background:rgba(217,169,59,.08);border-top:1px solid rgba(217,169,59,.18);font-size:12px;color:#b9c7d3}@media(max-width:820px){.history-subtabs{display:grid;grid-template-columns:1fr 1fr}.playoff-season-card{grid-template-columns:70px 1fr}.playoff-season-year{grid-row:1/4}.playoff-finish{border-right:0;border-bottom:1px solid rgba(255,255,255,.09);padding:15px 17px}.playoff-other{grid-column:2;grid-template-columns:1fr}.playoff-other>div{padding:15px 17px}.playoff-other>div+div{border-left:0;border-top:1px solid rgba(255,255,255,.09)}.playoff-note{grid-column:1/-1}.playoff-finish b,.playoff-other b{font-size:15px}}@media(max-width:520px){.history-subtabs{grid-template-columns:1fr}.playoff-season-card{grid-template-columns:58px 1fr}.playoff-season-year{font-size:22px}.playoff-finish,.playoff-other>div{padding:13px 14px}}`;
  document.head.appendChild(style);
  if(typeof render==='function'){
    const original=render;
    render=function(){
      if(String(route||'')==='history/playoffs'){playoffPage();return;}
      original();
      if(String(route||'')==='history')addArchiveTab();
    };
  }
  if(String(route||'')==='history')setTimeout(addArchiveTab,0);
})();