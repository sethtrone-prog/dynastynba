// Main Resources page: league constitution, latest rule changes, and league calendar.
(function(){
  let resourceTab='constitution';
  let constitutionText='';
  function ensureNav(){
    const nav=document.getElementById('mainNav');
    if(!nav||nav.querySelector('[data-route="resources"]')) return;
    const b=document.createElement('button');b.dataset.route='resources';b.textContent='RESOURCES';
    b.onclick=()=>{go('resources');nav.classList.remove('open')};
    const about=nav.querySelector('[data-route="league"]');about?nav.insertBefore(b,about):nav.appendChild(b);
  }
  const e=s=>String(s||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  function constitutionHtml(){
    if(!constitutionText)return '<div class="resource-loading">Loading constitution…</div>';
    const sections=constitutionText.split(/\n(?=[IVX]+\. )/);
    const intro=sections.shift()||'';
    return `<div class="constitution-doc"><div class="constitution-cover">${e(intro).replace(/\n/g,'<br>')}</div>${sections.map(s=>{const lines=s.split('\n');const title=lines.shift();return `<section class="constitution-section"><h2>${e(title)}</h2><div class="constitution-copy">${e(lines.join('\n'))}</div></section>`}).join('')}</div>`;
  }
  function panel(){
    if(resourceTab==='constitution')return `<section class="card resource-panel"><div class="card-pad section-title"><div><div class="eyebrow">Official Governing Document</div><h2>League Constitution</h2></div><span>Founded 2018 · 2026 Edition</span></div>${constitutionHtml()}</section>`;
    if(resourceTab==='changes')return `<section class="card resource-panel"><div class="card-pad section-title"><div><div class="eyebrow">League Amendments</div><h2>Recent Rule Changes</h2></div></div><div class="resource-placeholder">The latest changes and tweaks will appear here once the rule-change document is added.</div></section>`;
    return `<section class="card resource-panel"><div class="card-pad section-title"><div><div class="eyebrow">Current League Year</div><h2>League Calendar</h2></div></div><div class="resource-placeholder">This calendar will be connected to the current yearly Google Sheet.</div></section>`;
  }
  function draw(){
    const app=document.getElementById('app');if(!app)return;
    app.innerHTML=`<section class="page-head"><div class="eyebrow">Dynasty NBA · League Reference</div><h1>Resources</h1><p>League rules, amendments, and important dates in one permanent reference center.</p></section><div class="content"><div class="resource-tabs"><button class="${resourceTab==='constitution'?'active':''}" data-resource-tab="constitution">LEAGUE CONSTITUTION</button><button class="${resourceTab==='changes'?'active':''}" data-resource-tab="changes">RECENT RULE CHANGES</button><button class="${resourceTab==='calendar'?'active':''}" data-resource-tab="calendar">LEAGUE CALENDAR</button></div><div id="resourcePanel">${panel()}</div></div>`;
    app.querySelectorAll('[data-resource-tab]').forEach(b=>b.onclick=()=>{resourceTab=b.dataset.resourceTab;draw()});
    if(typeof setActive==='function')setActive();ensureNav();
  }
  fetch('constitution-2026.txt').then(r=>r.text()).then(t=>{constitutionText=t;if(String(route||'').split('/')[0]==='resources'&&resourceTab==='constitution')draw()}).catch(()=>{constitutionText='League constitution could not be loaded.'});
  const style=document.createElement('style');
  style.textContent=`.resource-tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}.resource-tabs button{background:#0b2744;color:#f3f7fb;border:1px solid #285b85;border-radius:5px;padding:12px 16px;font-weight:800;letter-spacing:.5px}.resource-tabs button.active{background:#d9a93b;color:#061323;border-color:#d9a93b}.resource-panel{overflow:hidden}.constitution-doc{max-width:980px;margin:0 auto;padding:20px 34px 44px}.constitution-cover{text-align:center;white-space:pre-line;font-size:16px;line-height:1.7;padding:20px 20px 34px;border-bottom:1px solid rgba(255,255,255,.12)}.constitution-cover:first-line{font-family:Oswald,sans-serif;font-size:30px;font-weight:700}.constitution-section{padding:26px 0;border-bottom:1px solid rgba(255,255,255,.1)}.constitution-section:last-child{border-bottom:0}.constitution-section h2{color:#d9a93b;margin:0 0 16px;font-family:Oswald,sans-serif;font-size:23px}.constitution-copy{white-space:pre-wrap;font-family:Inter,sans-serif;font-size:15px;line-height:1.75;color:#e8eef5}.resource-placeholder,.resource-loading{padding:34px;line-height:1.6;opacity:.78}@media(max-width:760px){.resource-tabs{display:grid;grid-template-columns:1fr}.resource-tabs button{width:100%;min-height:48px}.constitution-doc{padding:8px 18px 30px}.constitution-cover{padding:18px 4px 28px;font-size:14px}.constitution-section{padding:22px 0}.constitution-section h2{font-size:20px}.constitution-copy{font-size:14px;line-height:1.7}}`;
  document.head.appendChild(style);
  ensureNav();
  if(typeof render==='function'){const original=render;render=function(){if(String(route||'').split('/')[0]==='resources'){draw();return;}original();ensureNav();};}
  window.addEventListener('hashchange',()=>{ensureNav();if(location.hash.replace(/^#/,'').split('/')[0]==='resources')setTimeout(draw,0)});
  setTimeout(()=>{ensureNav();if(location.hash.replace(/^#/,'').split('/')[0]==='resources')draw()},150);
})();
