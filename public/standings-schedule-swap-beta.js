(function(){
 const cache=new Map(),pending=new Set();
 function renderMatrix(){
  const app=document.querySelector('#app');
  if(app?.querySelector('.page-head h1')?.textContent.trim()!=='Standings')return;
  const year=Number(document.querySelector('#seasonSelect')?.value);
  const card=app.querySelector('.standings-archive-card');
  if(!card||year<2027||app.querySelector('.schedule-swap-card'))return;
  const standingsTable=card.querySelector('.sos-standings-table');
  if(!standingsTable)return;
  if(!cache.has(year)){
   if(pending.has(year))return;
   pending.add(year);
   fetch('/api/espn-schedule-swap?season='+year).then(r=>r.json()).then(d=>{if(d.ok){cache.set(year,d);renderMatrix();}else{cache.set(year,{error:d.error||'Unavailable'});renderMatrix();}}).catch(()=>{cache.set(year,{error:'ESPN schedule data unavailable'});renderMatrix();}).finally(()=>pending.delete(year));
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
   ids.forEach(id=>{
    const tr=document.createElement('tr'),name=document.createElement('td');name.textContent=idToName.get(id)||String(id);name.className='schedule-swap-team';tr.appendChild(name);
    let sum=0,n=0;
    ids.forEach(scheduleId=>{
     const cell=document.createElement('td'),v=byId.get(id)?.get(scheduleId);
     cell.textContent=id===scheduleId?'—':v?String(v.wins)+(v.ties?' ('+v.ties+'T)':''):'—';
     cell.title=id===scheduleId?'Self-comparison excluded':v?String(v.wins)+'-'+String(v.losses)+(v.ties?'-'+String(v.ties):'')+' with '+(idToName.get(scheduleId)||scheduleId)+' schedule':'Unavailable';
     if(v&&id!==scheduleId){sum+=v.wins+v.ties*.5;n++;}
     if(id===scheduleId)cell.classList.add('schedule-swap-actual');
     tr.appendChild(cell);
    });
    const avg=document.createElement('td');avg.className='schedule-swap-average';avg.textContent=n?(sum/n).toFixed(1):'—';tr.appendChild(avg);tbody.appendChild(tr);
   });
   table.appendChild(tbody);wrap.appendChild(table);section.appendChild(wrap);
   const note=document.createElement('p');note.className='sos-explanation';
   note.textContent='Rows = team scoring; columns = whose opponent schedule is used. Each cell shows hypothetical wins through '+data.weeks.length+' fully completed week(s). Diagonal self-comparisons are excluded from the table and Avg Wins. A tie counts as half a win in Avg Wins. When a swapped schedule would pit a team against itself, the schedule owner takes that opponent slot. Hover a cell for W-L detail.';
   section.appendChild(note);
  }
  card.after(section);
 }
 const start=()=>{const app=document.querySelector('#app');if(!app)return;new MutationObserver(renderMatrix).observe(app,{childList:true,subtree:true});renderMatrix()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();