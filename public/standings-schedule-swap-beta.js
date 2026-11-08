(function(){
 const cache=new Map(),pending=new Set();
 function renderMatrix(){
  const app=document.querySelector('#app');
  if(!app)return;
  const card=app.querySelector('.standings-archive-card');
  const year=Number(document.querySelector('#seasonSelect')?.value||2027);
  if(!card||year<2027||app.querySelector('.schedule-swap-card'))return;
  // Render independently of the SOS enhancement; its API may load later or fail.
  // The schedule-swap matrix only requires the main standings card.
  if(!cache.has(year)){
   if(pending.has(year))return;
   pending.add(year);
   const loading=document.createElement('section');
   loading.className='card schedule-swap-card';
   loading.innerHTML='<div class="card-pad section-title"><h2>WINS WITH EVERY TEAM\'S SCHEDULE</h2><span>Loading completed ESPN matchups…</span></div>';
   card.after(loading);
   fetch('/api/espn-schedule-swap?season='+year).then(r=>r.json()).then(d=>{if(d.ok){cache.set(year,d);loading.remove();renderMatrix();}else{cache.set(year,{error:d.error||'Unavailable'});loading.remove();renderMatrix();}}).catch(()=>{cache.set(year,{error:'ESPN schedule data unavailable'});loading.remove();renderMatrix();}).finally(()=>pending.delete(year));
   return;
  }
  const data=cache.get(year),section=document.createElement('section');
  section.className='card schedule-swap-card';
  const title=document.createElement('div');title.className='card-pad section-title';
  title.innerHTML='<h2>WINS WITH EVERY TEAM\'S SCHEDULE</h2><span>Completed matchups only</span>';
  section.appendChild(title);
  if(data.error){const p=document.createElement('p');p.className='sos-explanation';p.textContent=data.error;section.appendChild(p);}
  else {
   const current=typeof standings==='function'?standings():[];
   const idToName=new Map(current.map(t=>[Number(t.ESPN_Team_ID),typeof franchiseLabel==='function'?franchiseLabel(t.Franchise_ID):t.ESPN_Team_Name]));
   const ids=current.map(t=>Number(t.ESPN_Team_ID)).filter(id=>data.teams.some(t=>t.id===id));
   const byId=new Map(data.matrix.map(t=>[t.teamId,new Map(t.against.map(x=>[x.scheduleTeamId,x]))]));
   const wrap=document.createElement('div');wrap.className='table-wrap';
   const table=document.createElement('table');table.className='data-table schedule-swap-table';
   const thead=document.createElement('thead'),hr=document.createElement('tr');
   ['Team',...ids.map(id=>idToName.get(id)||data.teams.find(t=>t.id===id)?.name||String(id)),'Avg Wins'].forEach((label,i)=>{
    const th=document.createElement('th');th.textContent=label;if(i>0&&i<=ids.length)th.title='Schedule of '+label;hr.appendChild(th);
   });
   thead.appendChild(hr);table.appendChild(thead);
   const tbody=document.createElement('tbody');
   const detail=document.createElement('div');detail.className='card-pad';detail.style.cssText='padding:16px;border-top:1px solid #35506a';detail.textContent='Click a result to inspect its weekly scores.';
   ids.forEach(id=>{
    const tr=document.createElement('tr'),name=document.createElement('td');name.textContent=idToName.get(id)||String(id);name.className='schedule-swap-team';tr.appendChild(name);
    let sum=0,n=0;
    ids.forEach(scheduleId=>{
     const cell=document.createElement('td'),v=byId.get(id)?.get(scheduleId);
     cell.textContent=v?String(v.wins)+(v.ties?' ('+v.ties+'T)':''):'—';
     cell.title=v?String(v.wins)+'-'+String(v.losses)+(v.ties?'-'+String(v.ties):'')+' with '+(idToName.get(scheduleId)||scheduleId)+' schedule'+(v.breakdown?.length?'\\n'+v.breakdown.map(x=>'Week '+x.week+': '+x.ownPoints+' vs '+x.opponentPoints+' ('+(idToName.get(x.opponentId)||data.teams.find(t=>t.id===x.opponentId)?.name||x.opponentId)+') = '+(x.ownPoints>x.opponentPoints?'W':x.ownPoints<x.opponentPoints?'L':'T')+(x.actual?' [actual matchup]':'')).join('\\n'):''):'Unavailable';
     if(v){sum+=v.wins+v.ties*.5;n++;}
     if(id===scheduleId)cell.classList.add('schedule-swap-actual');
     cell.style.cursor='pointer';
     cell.addEventListener('click',()=>{
      detail.replaceChildren();
      const rowName=idToName.get(id)||String(id),scheduleName=idToName.get(scheduleId)||String(scheduleId);
      const h=document.createElement('strong');h.textContent=rowName+' with '+scheduleName+' schedule: '+(v?v.wins+' wins, '+v.losses+' losses':'Unavailable');detail.appendChild(h);
      (v?.breakdown||[]).forEach(x=>{const p=document.createElement('p');const opponent=idToName.get(x.opponentId)||data.teams.find(t=>t.id===x.opponentId)?.name||x.opponentId;p.textContent='Week '+x.week+': '+rowName+' '+x.ownPoints+' vs '+opponent+' '+x.opponentPoints+' — '+(x.ownPoints>x.opponentPoints?'WIN':x.ownPoints<x.opponentPoints?'LOSS':'TIE')+(x.actual?' (actual matchup)':' (schedule swap)');detail.appendChild(p)});
     });
     tr.appendChild(cell);
    });
    const avg=document.createElement('td');avg.className='schedule-swap-average';avg.textContent=n?(sum/n).toFixed(1):'—';tr.appendChild(avg);tbody.appendChild(tr);
   });
   table.appendChild(tbody);wrap.appendChild(table);section.appendChild(wrap);section.appendChild(detail);
   const note=document.createElement('p');note.className='sos-explanation';
   note.textContent='Rows = team scoring; columns = whose opponent schedule is used. Each cell shows hypothetical wins through '+data.weeks.length+' fully completed week(s). Diagonal = actual wins. A tie counts as half a win in Avg Wins. When a row team actually faced the schedule owner, their actual head-to-head result counts. Click any result cell to see the exact weekly opponents, scores, and outcomes.';
   section.appendChild(note);
  }
  card.after(section);
 }
 const start=()=>{const app=document.querySelector('#app');if(!app)return;new MutationObserver(renderMatrix).observe(app,{childList:true,subtree:true});renderMatrix();window.addEventListener('hashchange',renderMatrix);setInterval(renderMatrix,1500)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();