// Adapt the existing route readers to clean browser URLs.
(()=>{
 const nativeHistory=window.history;
 const pages=window.DYNASTY_SHARE_PAGES||[];
 const byRoute=new Map(pages.map(p=>[p[0],p])),byPath=new Map(pages.map(p=>['/'+p[1],p[0]]));
 const cleanPath=()=>location.pathname.replace(/\/$/,'')||'/';
 function read(){return location.hash?location.hash.slice(1):(byPath.get(cleanPath())||'home')}
 let current=read();
 function path(route){return byRoute.has(route)?'/'+byRoute.get(route)[1]:'/?route='+encodeURIComponent(route)}
 function normalize(push=false){const target=path(current);if(location.pathname+location.search+location.hash!==target)nativeHistory[push?'pushState':'replaceState'](null,'',target)}
 function signal(){window.dispatchEvent(new HashChangeEvent('hashchange'))}
 window.DynastyLocation={get hash(){return '#'+current},set hash(value){const next=String(value).replace(/^#/,'')||'home';if(next===current){normalize();return}current=next;normalize(true);signal()}};
 const query=new URLSearchParams(location.search).get('route');if(query&&!location.hash)current=query;
 normalize();
 // Older hash links and native archive anchors are upgraded before other listeners run.
 window.addEventListener('hashchange',()=>{if(location.hash){current=location.hash.slice(1)||'home';normalize()}});
 window.addEventListener('popstate',()=>{current=read();normalize();signal()});
})();
