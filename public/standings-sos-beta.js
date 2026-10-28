(function(){
 const cache=new Map(),pending=new Set();
 function augment(){
  const app=document.querySelector('#app'),heading=app?.querySelector('.page-head h1');
  if(!heading||heading.textContent.trim()!=='Standings')return;
  const table=app.querySelector('.standings-archive-card table.data-table');
  const year=Number(document.querySelector('#seasonSelect')?.value);
  if(!table||year<2027||table.dataset.sosYear===String(year))return;
  const rows=cache.get(year);
  if(!rows){
   if(pending.has(year))return;
   pending.add(year);
   fetch('/api/espn-sos?season='+year).then(r=>r.json()).then(d=>{if(d.ok){cache.set(year,d);augment()}}).catch(()=>{}).finally(()=>pending.delete(year));
   return;
  }
  const heads=table.querySelectorAll('thead tr th');
  if(heads.length!==6)return;
  ['PA','Trad. SOS','Fantasy SOS','SOS Rank'].forEach(h=>{const th=document.createElement('th');th.textContent=h;th.title={PA:'Total opponent points against', 'Trad. SOS':'Combined winning percentage of opponents faced', 'Fantasy SOS':'Average points scored against this team per completed matchup','SOS Rank':'Average of traditional and fantasy SOS ranks; 1 is toughest'}[h];heads[0].parentElement.appendChild(th)});
  const byId=new Map(rows.teams.map(x=>[String(x.id),x]));
  const teamRows=[...table.querySelectorAll('tbody tr')];
  // Existing standings rows are in the same order as standings(), retaining ESPN's ordering.
  const current=typeof standings==='function'?standings():[];
  teamRows.forEach((tr,i)=>{
   const id=String(current[i]?.ESPN_Team_ID||'');const s=byId.get(id);
   const values=s&&s.played?[s.pa.toLocaleString(undefined,{maximumFractionDigits:2}),s.traditional?.toFixed(3)??'—',s.fantasy?.toLocaleString(undefined,{maximumFractionDigits:2})??'—',s.sosRank??'—']:['—','—','—','—'];
   values.forEach((v,j)=>{const td=document.createElement('td');td.textContent=v;td.className=j===3?'sos-rank-cell':'sos-number-cell';tr.appendChild(td)});
  });
  table.dataset.sosYear=String(year);
  table.classList.add('sos-standings-table');
  const note=document.createElement('p');note.className='sos-explanation';note.textContent='SOS: 1 = toughest schedule. Traditional SOS uses opponents’ current records; Fantasy SOS uses their actual points against you. Combined rank weights both equally. Only completed ESPN matchups count.';
  table.closest('.table-wrap')?.after(note);
 }
 const observer=new MutationObserver(()=>augment());
 const start=()=>{const app=document.querySelector('#app');if(app){observer.observe(app,{childList:true,subtree:true});augment()}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();