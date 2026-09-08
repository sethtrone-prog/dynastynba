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
      const next=publicTeamName(el.textContent);
      if(next) el.textContent=next;
    });
  }
  function scheduleFix(){setTimeout(fixScheduleNames,50);setTimeout(fixScheduleNames,250);}
  window.addEventListener('hashchange',scheduleFix);
  document.addEventListener('click',e=>{if(e.target.closest('[data-route="schedule"]'))scheduleFix();});
  const observer=new MutationObserver(()=>{if(location.hash.startsWith('#schedule'))fixScheduleNames();});
  observer.observe(document.getElementById('app'),{childList:true,subtree:true});
  scheduleFix();
})();
