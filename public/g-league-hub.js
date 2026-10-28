/* G-League hub: uses current-season roster statuses from the site's existing database. */
(function(){
 const originalTeams=teams,originalRender=render;
 function hub(){
  const sid=seasonId(season);
  const cards=DB.Franchises.map(f=>{
   const fid=f.Franchise_ID,name=franchiseLabel(fid);
   const members=DB.Rosters.filter(r=>String(r.Franchise_ID)===String(fid)&&r.Season_ID===sid&&/^(g[\\s-]?league|gleague)$/i.test(String(r.Roster_Status||'').trim()));
   const unique=[...new Map(members.map(r=>[String(r.Player_ID),r])).values()].slice(0,5);
   const slots=Array.from({length:5},(_,i)=>{
    const r=unique[i],p=r&&player(r.Player_ID),label=p?.Player_Name||r?.Player_Name_Raw;
    return '<div class="gl-slot '+(r?'filled':'vacant')+'"><span class="gl-number">'+(i+1)+'</span><span>'+(r?(p?.Player_ID?playerLink(label):esc(label||'Player not mapped')):'EMPTY SLOT')+'</span><span class="gl-symbol">'+(r?'●':'+')+'</span></div>';
   }).join('');
   return '<article class="gl-card"><header>'+teamMark(fid,name,'gl-logo')+'<div><h2>'+esc(name)+'</h2><small>'+esc(f.Current_Owner||'')+'</small></div><strong>'+unique.length+'/5</strong></header><div class="gl-slots">'+slots+'</div><button class="gl-full" onclick="go(\'team/'+esc(fid)+'/roster\')">VIEW FULL ROSTER →</button></article>';
  }).join('');
  layout('G-League Rosters','All 10 franchises · Five G-League slots per team','<div class="gl-intro"><span>'+season+' DEVELOPMENT ROSTERS</span><button onclick="go(\'teams\')">← ALL TEAMS</button></div><div class="gl-grid">'+cards+'</div>');
 }
 teams=function(){originalTeams();const grid=document.querySelector('#app .team-grid');if(grid){grid.insertAdjacentHTML('beforebegin','<div class="gl-entry"><button onclick="go(\'g-league\')">VIEW G-LEAGUE ROSTERS →</button><span>All 10 franchises · 50 total slots</span></div>');}};
 render=function(){if(route==='g-league'){hub();return;}originalRender();};
})();
