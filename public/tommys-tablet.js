// Add future posts to data/tommys-tablet.json; stable slugs preserve shared links.
(()=>{
  let pending;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url=p=>'#resources/tablet/'+encodeURIComponent(p.slug);
  const date=p=>new Date(p.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  async function mount(){
    const root=document.getElementById('tommysTablet');if(!root)return;
    root.innerHTML='<div class="resource-loading" role="status">Opening Tommy’s Tablet…</div>';
    try{
      if(!pending)pending=fetch('data/tommys-tablet.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Posts unavailable');return r.json()}).catch(e=>{pending=null;throw e});
      const posts=(await pending).slice().sort((a,b)=>b.date.localeCompare(a.date));
      if(!root.isConnected)return;
      let slug;try{slug=decodeURIComponent(location.hash.split('/')[2]||'')}catch{slug='missing'}
      const post=slug?posts.find(p=>p.slug===slug):posts[0];
      root.innerHTML=`<header class="tablet-masthead card"><img src="tommy-reporter.jpg" alt="Tommy reporting courtside with his notebook" width="180" height="180"><div><div class="eyebrow">The League Column</div><h2>Tommy’s Tablet</h2><p>League takes, season previews, and a little courtside commentary.</p><span class="tablet-signature">By Tommy L</span></div></header><div class="tablet-layout"><article class="tablet-article card">${post?`<header><div class="eyebrow">${slug?'From the Tablet':'Latest Entry'}</div><h2>${esc(post.title)}</h2><div class="tablet-meta"><span class="tablet-signature">By ${esc(post.author)}</span> · <time datetime="${esc(post.date)}">${date(post)}</time></div><a class="tablet-permalink" href="${url(post)}">Link to this post ↗</a></header><div class="tablet-copy">${post.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:`<h2>${slug?'Post not found':'The tablet is ready'}</h2><p>${slug?'<a href="#resources/tablet">Return to the latest post</a>':'Check back for the first entry.'}</p>`}</article><aside class="tablet-archive card" aria-label="Post archive"><div class="eyebrow">From the Notebook</div><h3>All Posts</h3>${posts.map(p=>`<a href="${url(p)}" ${p===post?'aria-current="page"':''}><b>${esc(p.title)}</b><time datetime="${esc(p.date)}">${date(p)}</time></a>`).join('')}</aside></div>`;
    }catch{if(root.isConnected)root.innerHTML='<div class="resource-loading">The posts could not be loaded. <button type="button" id="tabletRetry">Try again</button></div>';root.querySelector('#tabletRetry')?.addEventListener('click',mount)}
  }
  window.TommysTablet={mount};
})();
