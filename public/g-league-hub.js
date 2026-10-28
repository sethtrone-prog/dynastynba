/* G-League hub: uses current-season roster statuses from the site's existing database. */
(function(){
 const originalTeams=teams,originalRender=render;
 const years=[2019,2020,2021,2022,2023,2024,2025,2026,2027];
 let stats=new Map(),loaded=false,loading=false,liveTeams=null,liveLoading=false;
 const espnId=p=>String(window.VERIFIED_ESPN_IDS?.[p?.Player_ID]||p?.ESPN_Player_ID||'');
 async function loadLive(){
  if(liveLoading)return;liveLoading=true;
  try{
   const response=await fetch('/api/google-sheet-live',{cache:'no-store'});
   const data=await response.json();
   if(response.ok&&data.ok&&data.teams){liveTeams=data.teams;if(route==='g-league')hub();}
  }catch(e){console.warn('G-League live roster unavailable',e)}
  finally{liveLoading=false}
 }
 async function loadStats(){
  if(loading||loaded)return;loading=true;
  const results=await Promise.allSettled(years.map(async year=>{
   const response=await fetch('/api/espn-player-test?compact=1&season='+year);
   if(!response.ok)throw Error('ESPN '+year);
   return {year,data:await response.json()};
  }));
  const next=new Map();
  for(const result of results){
   if(result.status!=='fulfilled')continue;
   const {year,data}=result.value;
   for(const p of data.players||[]){
    if(p.espnId==null||!(Number(p.gp)>0))continue;
    const id=String(p.espnId),entry=next.get(id)||{games:0,fppg:null};
    entry.games+=Number(p.gp);
    if(year===2027&&Number.isFinite(Number(p.ppg)))entry.fppg=Number(p.ppg);
    next.set(id,entry);
   }
  }
  stats=next;loaded=results.every(x=>x.status==='fulfilled');loading=false;
  if(route==='g-league')hub();
 }

 function hub(){
  const sid=seasonId(season);if(!loaded&&!loading)loadStats();if(!liveTeams&&!liveLoading)loadLive();
  const cards=DB.Franchises.map(f=>{
   const fid=f.Franchise_ID,name=franchiseLabel(fid);
   const members=DB.Rosters.filter(r=>String(r.Franchise_ID)===String(fid)&&r.Season_ID===sid&&/^g[ -]?league$/i.test(String(r.Roster_Status||'').trim()));
   const sheetRows=liveTeams?.[fid]?.gLeague;
   const unique=Array.isArray(sheetRows)?sheetRows.slice(0,5).map(row=>{
    if(!row.display)return null;
    const raw=String(row.display).trim();
    const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\\s+/g,' ').trim();
    const needle=norm(raw);
    const p=DB.Players.filter(p=>p.Player_Name).sort((a,b)=>b.Player_Name.length-a.Player_Name.length).find(p=>needle===norm(p.Player_Name)||needle.startsWith(norm(p.Player_Name)+' '));
    return {Player_ID:p?.Player_ID,Player_Name_Raw:raw};
   }):[...new Map(members.map(r=>[String(r.Player_ID),r])).values()].slice(0,5);
   const slots=Array.from({length:5},(_,i)=>{
    const r=unique[i],p=r?.Player_ID&&player(r.Player_ID),label=p?.Player_Name||r?.Player_Name_Raw;
    const stat=r?stats.get(espnId(p)):null;
    const gp=r?(stat?String(stat.games):(loading?'…':'-')):'';
    const fppg=r?(stat?.fppg!=null?stat.fppg.toFixed(2):(loading?'…':'-')):'';
    return '<div class="gl-slot '+(r?'filled':'vacant')+'"><span class="gl-number">'+(i+1)+'</span><span class="gl-player">'+(r?(p?.Player_ID?playerLink(label):esc(label||'Player not mapped')):'EMPTY SLOT')+'</span><span class="gl-stat">'+gp+'</span><span class="gl-stat">'+fppg+'</span></div>';
   }).join('');
   return '<article class="gl-card"><header>'+teamMark(fid,name,'gl-logo')+'<div><h2>'+esc(name)+'</h2><small>'+esc(f.Current_Owner||'')+'</small></div><strong>'+unique.filter(Boolean).length+'/5</strong></header><div class="gl-stat-head"><span>PLAYER</span><span>CAREER GP*</span><span>2026–27 FPPG</span></div><div class="gl-slots">'+slots+'</div><button class="gl-full" onclick="go(\'team/'+esc(fid)+'/roster\')">VIEW FULL ROSTER →</button></article>';
  }).join('');
  layout('G-League Rosters','All 10 franchises · Five G-League slots per team','<div class="gl-intro"><span>'+season+' DEVELOPMENT ROSTERS</span><button onclick="go(\'teams\')">← ALL TEAMS</button></div><div class="gl-grid">'+cards+'</div><p class="gl-footnote">* Career GP reflects ESPN fantasy records since 2018–19, not necessarily all NBA career games. A dash indicates no current-season games or unavailable data.</p>');
 }
 teams=function(){originalTeams();const grid=document.querySelector('#app .team-grid');if(grid){grid.insertAdjacentHTML('beforebegin','<div class="gl-entry"><button onclick="go(\'g-league\')">VIEW G-LEAGUE ROSTERS →</button><span>All 10 franchises · 50 total slots</span></div>');}};
 render=function(){if(route==='g-league'){hub();return;}originalRender();};
})();
