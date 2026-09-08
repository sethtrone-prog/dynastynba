// Replace internal franchise references (F01-F10) with public team names on Schedule cards.
(function(){
  function publicTeamName(value){
    const raw=String(value||'').trim();
    if(!/^F\d{2}$/i.test(raw)) return raw;
    try{
      if(typeof franchiseLabel==='function') return franchiseLabel(raw) || raw;
    }catch(e){}
    const espn=(typeof DB!=='undefined'&&DB?.['ESPN Teams']||[]).find(x=>String(x.Franchise_ID).toUpperCase()===raw.toUpperCase());
    const franchise=(typeof DB!=='undefined'&&DB?.Franchises||[]).find(x=>String(x.Franchise_ID).toUpperCase()===raw.toUpperCase());
    return espn?.ESPN_Team_Name||franchise?.Franchise_Name||franchise?.Current_Owner||raw;
  }

  function fixScheduleNames(){
    if(!location.hash.startsWith('#schedule')) return;
    document.querySelectorAll('.matchup-row .match-team b').forEach(el=>{
      const current=el.textContent.trim();
      const next=publicTeamName(current);
      if(next && next!==current) el.textContent=next;
    });
  }

  function scheduleFix(){
    setTimeout(fixScheduleNames,25);
    setTimeout(fixScheduleNames,150);
  }

  window.addEventListener('hashchange',scheduleFix);
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-route="schedule"]')) scheduleFix();
  });

  // Observe app renders, but only schedule a single pass instead of mutating recursively.
  let queued=false;
  const app=document.getElementById('app');
  if(app){
    const observer=new MutationObserver(()=>{
      if(!location.hash.startsWith('#schedule')||queued) return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        fixScheduleNames();
      });
    });
    observer.observe(app,{childList:true,subtree:true});
  }

  scheduleFix();
})();
