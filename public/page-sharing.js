// Keep hash navigation compatible, while copied URLs have a crawlable page path.
(()=>{
 fetch('/share-pages.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(pages=>{
  function update(){
   const route=location.hash.slice(1)||'home',page=pages.find(p=>p[0]===route);
   // Unknown routes must not retain another page's path or preview.
   const target=page?'/'+page[1]:'/';
   if(location.pathname!==target)history.replaceState(null,'',target+location.search+location.hash);
   if(!page){document.title='Dynasty NBA';for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])document.querySelector(selector)?.setAttribute('content','Dynasty NBA');return;}
   const title=page[2]==='Dynasty NBA'?page[2]:page[2]+' | Dynasty NBA';document.title=title;
   const set=(selector,value)=>{const el=document.querySelector(selector);if(el)el.setAttribute(el.tagName==='LINK'?'href':'content',value)};
   const image='https://www.dynastynba.com/'+(route.startsWith('resources/tablet')?'tommy-reporter.jpg':'dynastynba-logo.jpg');
   set('meta[property="og:image"]',image);set('meta[name="twitter:image"]',image);set('meta[name="twitter:title"]',title);set('meta[name="twitter:description"]',page[3]);
   set('meta[name="description"]',page[3]);set('meta[property="og:title"]',title);set('meta[property="og:description"]',page[3]);set('meta[property="og:url"]','https://www.dynastynba.com'+target);set('link[rel="canonical"]','https://www.dynastynba.com'+target);
  }
  window.addEventListener('hashchange',update);update();
 }).catch(()=>{});
})();
