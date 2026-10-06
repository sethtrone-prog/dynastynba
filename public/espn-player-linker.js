// Beta: reconcile Dynasty player records with the live ESPN player feed.
// Only unique normalized-name matches are auto-linked; ambiguous names remain unresolved.
(function(){
  const normalize = v => String(v||'').toLowerCase().normalize('NFKD').replace(/[’'`]/g,'').replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const espnName = p => p.fullName || p.name || p.playerName || p.displayName || p.athleteName || '';
  const espnId = p => p.espnId || p.id || p.playerId || p.athleteId || '';

  async function reconcile(){
    if(!window.DB || !Array.isArray(DB.Players)) return false;
    let payload=null;
    try{
      const r=await fetch('/api/espn-player-test?compact=1&season=2026');
      if(r.ok) payload=await r.json();
    }catch(e){ console.warn('ESPN player linker: feed unavailable',e); }
    const feed=payload?.players||[];
    if(!feed.length) return false;

    const byName=new Map();
    feed.forEach(p=>{
      const n=normalize(espnName(p)), id=espnId(p);
      if(!n||!id) return;
      if(!byName.has(n)) byName.set(n,[]);
      byName.get(n).push({id:String(id),player:p});
    });

    let added=0, validExisting=0, unresolved=0, ambiguous=0;
    DB.Players.forEach(p=>{
      const existing=String(p.ESPN_Player_ID||'').trim();
      if(existing && feed.some(e=>String(espnId(e))===existing)){ validExisting++; return; }
      const matches=byName.get(normalize(p.Player_Name))||[];
      if(matches.length===1){ p.ESPN_Player_ID=matches[0].id; added++; }
      else if(matches.length>1) ambiguous++;
      else unresolved++;
    });
    window.__ESPN_PLAYER_LINK_AUDIT__={feed:feed.length,added,validExisting,unresolved,ambiguous,linked:added+validExisting};
    console.info('ESPN player link audit',window.__ESPN_PLAYER_LINK_AUDIT__);
    if((location.hash||'').startsWith('#players') && typeof render==='function') render();
    return true;
  }

  let tries=0;
  const timer=setInterval(async()=>{
    tries++;
    if(await reconcile() || tries>20) clearInterval(timer);
  },250);
})();
