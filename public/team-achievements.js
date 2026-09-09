// Replace team-header archive/player/transaction counts with audited competitive achievements.
// Counts are franchise-level and follow ownership lineage across the 2019-2026 ESPN archive.
(function(){
  const achievements={
    F01:{championships:1,playoffs:2},
    F02:{championships:1,playoffs:4},
    F03:{championships:1,playoffs:3},
    F04:{championships:0,playoffs:0},
    F05:{championships:0,playoffs:4},
    F06:{championships:0,playoffs:2},
    F07:{championships:1,playoffs:4},
    F08:{championships:0,playoffs:2},
    F09:{championships:1,playoffs:5},
    F10:{championships:3,playoffs:7}
  };

  function updateTeamHeader(){
    const parts=location.hash.replace(/^#/,'').split('/');
    if(parts[0]!=='team'||!parts[1])return;
    const fid=String(parts[1]).toUpperCase(),a=achievements[fid];
    if(!a)return;
    const meta=document.querySelector('#app .team-command .team-command-meta');
    if(!meta)return;
    const spans=meta.querySelectorAll('span');
    if(spans.length<3)return;

    // espn-history-ui.js places the audited all-time record in the first slot asynchronously.
    const recordSource=[...spans].map(s=>s.textContent.trim()).find(t=>/^\d+-\d+(?:-\d+)?\s+ALL-TIME REGULAR-SEASON RECORD$/i.test(t));
    if(!recordSource)return;

    const champText=`${a.championships} ${a.championships===1?'CHAMPIONSHIP':'CHAMPIONSHIPS'}`;
    const playoffText=`${a.playoffs} ${a.playoffs===1?'PLAYOFF APPEARANCE':'PLAYOFF APPEARANCES'}`;
    if(spans[0].textContent!==champText)spans[0].textContent=champText;
    if(spans[1].textContent!==playoffText)spans[1].textContent=playoffText;
    if(spans[2].textContent!==recordSource)spans[2].textContent=recordSource;
  }

  const app=document.getElementById('app');
  if(app)new MutationObserver(updateTeamHeader).observe(app,{childList:true,subtree:true,characterData:true});
  window.addEventListener('hashchange',()=>setTimeout(updateTeamHeader,80));
  setTimeout(updateTeamHeader,120);
})();
