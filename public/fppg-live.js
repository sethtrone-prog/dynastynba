// Current-season ESPN scoring refresh, independent of roster-sheet refreshes.
(()=>{
 const EVERY=5*60*1000;let busy=false,lastSuccess=0,lastError=false,retry;
 const currentRoute=()=>window.DynastyLocation?.hash.slice(1)||'home';
 function status(){
  const tools=document.querySelector('#playerFilter')?.parentElement;if(!tools)return;
  let el=document.getElementById('espnFppgStatus');if(!el){el=document.createElement('span');el.id='espnFppgStatus';el.style.cssText='flex-basis:100%;font-size:12px;color:#b6ccdd';tools.appendChild(el)}
  const text=lastSuccess?'ESPN FPPG updated '+new Date(lastSuccess).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+(lastError?' · Refresh failed; showing last loaded stats.':' · Auto-refreshes every 5 minutes.'):lastError?'ESPN FPPG unavailable. Retrying…':'Loading current ESPN FPPG…';
  el.textContent=text+' ';const button=document.createElement('button');button.type='button';button.className='inline-link';button.textContent=busy?'Refreshing…':'Refresh stats';button.disabled=busy;button.onclick=()=>refresh();el.appendChild(button);
 }
 function redraw(){
  if(typeof DB==='undefined'||!DB)return;
  const r=currentRoute();
  if(r==='players'){
   const search=document.getElementById('playerFilter')?.value||'',team=document.getElementById('playerTeamFilter')?.value??'FREE_AGENT';
   const fsort=playerFppgSort,bsort=playerBaseSort;
   players();document.getElementById('playerFilter').value=search;document.getElementById('playerTeamFilter').value=team;
   if(bsort){playerBaseSort=-bsort;sortPlayersByBaseUnit()}else if(fsort===1){playerFppgSort=-1;sortPlayersByFppg()}
   filterPlayers();
  }else if(/^team\/[^/]+\/roster$/.test(r)){render()}
  status();
 }
 async function refresh(){
  if(busy)return;busy=true;status();
  try{
   const response=await fetch('/api/espn-player-test?compact=1&season=2027&refresh='+Date.now(),{cache:'no-store'});
   if(!response.ok)throw Error('ESPN request failed');const data=await response.json();
   if(Number(data.season)!==2027||!Array.isArray(data.players)||!data.players.length)throw Error('Invalid ESPN response');
   const rows=data.players.filter(p=>p.espnId!=null&&Number(p.gp)>0&&p.ppg!=null&&Number.isFinite(Number(p.ppg)));
   const next=new Map(rows.map(p=>[String(p.espnId),Number(p.ppg)]));
   const changed=next.size!==CURRENT_SEASON_FPPG.size||[...next].some(([id,n])=>CURRENT_SEASON_FPPG.get(id)!==n);
   CURRENT_SEASON_FPPG.clear();for(const [id,n] of next)CURRENT_SEASON_FPPG.set(id,n);
   lastSuccess=Date.now();lastError=false;clearTimeout(retry);if(changed)redraw();
  }catch(e){lastError=true;clearTimeout(retry);retry=setTimeout(refresh,30000)}finally{busy=false;status()}
 }
 window.addEventListener('hashchange',()=>{status();if(Date.now()-lastSuccess>EVERY)refresh()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastSuccess>60000)refresh()});
 const app=document.getElementById('app');if(app)new MutationObserver(()=>{if(document.getElementById('playerFilter')&&!document.getElementById('espnFppgStatus'))status()}).observe(app,{childList:true,subtree:true});
 setInterval(refresh,EVERY);refresh();
})();
