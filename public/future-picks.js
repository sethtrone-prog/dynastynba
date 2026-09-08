// 2027 future draft-pick ownership from the corrected team cap sheets.
(function(){
  const FUTURE_PICKS={"F01":[{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2028,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to J&J"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Seth"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F02":[{"year":2027,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Tom"},{"year":2027,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Nate"},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Nate"},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from J&J"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Andrew"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Derek"},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from J&J"},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F03":[{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2027,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Derek"},{"year":2028,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to J&J"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Jordan"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F04":[{"year":2026,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2026,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2026,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Seth"},{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2027,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Seth"},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Tom"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F05":[{"year":2027,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to J&J"},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Jake"},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from J&J"},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Tom"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Nate"},{"year":2029,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Brandon"},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Tom"},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Seth"},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F06":[{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2027,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Derek"},{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Derek"},{"year":2028,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Brandon"},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Jake"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Andrew"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Brandon"},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F07":[{"year":2026,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2026,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2028,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Seth"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F08":[{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2027,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Jake"},{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Brandon"},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Seth"},{"year":2028,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Jordan"},{"year":2028,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Nate"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Seth"},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F09":[{"year":2027,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Seth"},{"year":2027,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Brandon"},{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Seth"},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Brandon"},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2028,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Derek"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Tom"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}],"F10":[{"year":2026,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Jordan"},{"year":2026,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2026,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Jake"},{"year":2027,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Nate"},{"year":2027,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Tom"},{"year":2027,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Nate"},{"year":2027,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Jordan"},{"year":2028,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2028,"round":2,"label":"2ND ROUND","traded":true,"note":"Outgoing to Andrew"},{"year":2028,"round":2,"label":"2ND ROUND","traded":false,"note":"Incoming from Diaz"},{"year":2029,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2029,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":true,"note":"Outgoing to Derek"},{"year":2030,"round":2,"label":"2ND ROUND","traded":false,"note":""},{"year":2030,"round":1,"label":"1ST ROUND","traded":false,"note":"Incoming from Tom via Jake"},{"year":2031,"round":1,"label":"1ST ROUND","traded":false,"note":""},{"year":2031,"round":2,"label":"2ND ROUND","traded":false,"note":""}]};

  function escPick(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function routeInfo(){
    const p=location.hash.replace(/^#/,'').split('/');
    return {fid:p[1]||'', tab:p[2]||'overview'};
  }
  function renderFuturePicks(){
    const {fid,tab}=routeInfo();
    document.querySelector('.future-draft-picks-card')?.remove();
    if(tab!=='picks'||!FUTURE_PICKS[fid]) return;

    const subhead=document.querySelector('.team-subhead');
    const pickCards=document.querySelector('.pick-cards');
    if(!subhead||!pickCards) return;

    const rows=FUTURE_PICKS[fid];
    const groups=[...new Set(rows.map(r=>r.year))].sort((a,b)=>a-b);
    const section=document.createElement('section');
    section.className='card future-draft-picks-card';
    section.innerHTML=`
      <div class="card-pad section-title">
        <div><div class="eyebrow">CURRENT DRAFT CAPITAL</div><h2>Future Draft Picks</h2></div>
        <span>Corrected master sheet · traded picks remain visible</span>
      </div>
      <div class="future-picks-years">
        ${groups.map(year=>`
          <div class="future-pick-year">
            <div class="future-pick-year-head">${year} DRAFT</div>
            <div class="table-wrap"><table class="data-table future-picks-table">
              <thead><tr><th>Round</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>
                ${rows.filter(r=>r.year===year).map(r=>`
                  <tr class="${r.traded?'future-pick-traded':''}">
                    <td><b class="${r.traded?'pick-struck':''}">${escPick(r.label)}</b></td>
                    <td><span class="future-pick-status ${r.traded?'traded':'owned'}">${r.traded?'TRADED':'OWNED'}</span></td>
                    <td>${escPick(r.note||'Original team pick')}</td>
                  </tr>`).join('')}
              </tbody>
            </table></div>
          </div>`).join('')}
      </div>`;

    subhead.parentNode.insertBefore(section,subhead);
    const eyebrow=subhead.querySelector('.eyebrow');
    const h2=subhead.querySelector('h2');
    const p=subhead.querySelector('p');
    if(eyebrow) eyebrow.textContent='DRAFT HISTORY';
    if(h2) h2.textContent='Historical Picks';
    if(p) p.textContent='Completed rookie-draft selections and historical ownership tied to this franchise.';
  }

  function schedule(){setTimeout(renderFuturePicks,25);}
  window.addEventListener('hashchange',schedule);
  document.addEventListener('click',e=>{
    if(e.target.closest('[onclick*="go(\'team/"], .team-tabs button')) schedule();
  });
  document.getElementById('seasonSelect')?.addEventListener('change',schedule);
  if(location.hash.includes('/picks')) schedule();

  const style=document.createElement('style');
  style.textContent=`
    .future-draft-picks-card{margin-bottom:22px;overflow:hidden}
    .future-picks-years{display:grid;gap:0}
    .future-pick-year{border-top:1px solid rgba(255,255,255,.08)}
    .future-pick-year-head{padding:13px 18px 9px;font-family:Oswald,Inter,sans-serif;font-weight:700;letter-spacing:.06em;color:var(--gold,#e9a23b);background:rgba(255,255,255,.018)}
    .future-picks-table{width:100%}
    .future-picks-table th:first-child,.future-picks-table td:first-child{width:180px}
    .future-picks-table th:nth-child(2),.future-picks-table td:nth-child(2){width:120px}
    .future-pick-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.08em}
    .future-pick-status.owned{background:rgba(88,184,120,.14);border:1px solid rgba(88,184,120,.35)}
    .future-pick-status.traded{background:rgba(220,90,90,.12);border:1px solid rgba(220,90,90,.34);opacity:.9}
    .pick-struck{text-decoration:line-through;text-decoration-thickness:2px;opacity:.62}
    .future-pick-traded td{opacity:.78}
    @media(max-width:700px){
      .future-picks-table th:first-child,.future-picks-table td:first-child{width:auto}
      .future-picks-table th:nth-child(2),.future-picks-table td:nth-child(2){width:auto}
    }
  `;
  document.head.appendChild(style);
})();
