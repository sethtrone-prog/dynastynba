// Main Resources page: league constitution, latest rule changes, and league calendar.
// Content is intentionally placeholder-based until the source documents / yearly Google Sheet calendar are connected.
(function(){
  function ensureNav(){
    const nav=document.getElementById('mainNav');
    if(!nav||nav.querySelector('[data-route="resources"]')) return;
    const b=document.createElement('button');
    b.dataset.route='resources';
    b.textContent='RESOURCES';
    b.onclick=()=>{go('resources');nav.classList.remove('open')};
    const about=nav.querySelector('[data-route="league"]');
    about?nav.insertBefore(b,about):nav.appendChild(b);
  }

  function draw(){
    const app=document.getElementById('app');
    if(!app)return;
    app.innerHTML=`<section class="page-head"><div class="eyebrow">Dynasty NBA · League Reference</div><h1>Resources</h1><p>Central home for the league constitution, the latest rule changes, and the official league calendar.</p></section>
    <div class="content">
      <div class="grid resources-grid">
        <section class="card span-4 resource-card">
          <div class="card-pad">
            <div class="resource-icon">§</div>
            <h2>League Constitution</h2>
            <p>The complete governing document for Dynasty NBA league rules and procedures.</p>
            <div class="resource-status">Awaiting constitution document</div>
          </div>
        </section>
        <section class="card span-4 resource-card">
          <div class="card-pad">
            <div class="resource-icon">↻</div>
            <h2>Recent Rule Changes</h2>
            <p>A running record of the newest league rule changes, amendments, and clarifications.</p>
            <div class="resource-status">Awaiting latest changes document</div>
          </div>
        </section>
        <section class="card span-4 resource-card">
          <div class="card-pad">
            <div class="resource-icon">▣</div>
            <h2>League Calendar</h2>
            <p>Key league dates and deadlines pulled from the current yearly league sheet.</p>
            <div class="resource-status">Google Sheet calendar connection pending</div>
          </div>
        </section>
      </div>
    </div>`;
    if(typeof setActive==='function')setActive();
    ensureNav();
  }

  const style=document.createElement('style');
  style.textContent=`.resources-grid{align-items:stretch}.resource-card{height:100%}.resource-card .card-pad{height:100%;display:flex;flex-direction:column;gap:12px}.resource-card h2{margin:0}.resource-card p{margin:0;line-height:1.55}.resource-icon{font-size:30px;font-weight:800;color:#d9a93b}.resource-status{margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;opacity:.72}@media(max-width:760px){.resources-grid .span-4{grid-column:1/-1}}`;
  document.head.appendChild(style);

  ensureNav();
  if(typeof render==='function'){
    const original=render;
    render=function(){
      if(String(route||'').split('/')[0]==='resources'){draw();return;}
      original();
      ensureNav();
    };
  }
  window.addEventListener('hashchange',()=>{
    ensureNav();
    if(location.hash.replace(/^#/,'').split('/')[0]==='resources')setTimeout(draw,0);
  });
  setTimeout(()=>{
    ensureNav();
    if(location.hash.replace(/^#/,'').split('/')[0]==='resources')draw();
  },150);
})();
