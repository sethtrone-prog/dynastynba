const fs=require('fs'),path=require('path');
const pages=JSON.parse(fs.readFileSync('public/share-pages.json','utf8'));
const db=JSON.parse(fs.readFileSync('public/data/site-data.json','utf8'));
const teamTabs=['overview','roster','picks','wins-pool','transactions','rivals','history','contracts'];
for(const team of db.Franchises){
 const owner=team.Current_Owner||team.Franchise_Name||team.Franchise_ID;
 pages.push(['team/'+team.Franchise_ID,'team/'+team.Franchise_ID,owner+' | Team Overview','Dynasty NBA franchise overview for '+owner+'.']);
 for(const tab of teamTabs){const label=tab==='wins-pool'?'Wins Pool':tab[0].toUpperCase()+tab.slice(1);pages.push(['team/'+team.Franchise_ID+'/'+tab,'team/'+team.Franchise_ID+'/'+tab,owner+' | '+label,label+' for '+owner+' in Dynasty NBA.']);}
}
for(const player of db.Players){if(player.Player_ID)pages.push(['player/'+player.Player_ID,'player/'+player.Player_ID,player.Player_Name+' | Player Card','Dynasty NBA statistics, contracts, roster history, and transactions for '+player.Player_Name+'.']);}
const posts=JSON.parse(fs.readFileSync('public/data/tommys-tablet.json','utf8'));
for(const post of posts){const route='resources/tablet/'+post.slug;if(!pages.some(p=>p[0]===route))pages.push([route,'tommys-tablet/'+post.slug,post.title+' | Tommy’s Tablet',post.title+' by '+post.author+' in Tommy’s Tablet.']);}
fs.writeFileSync('public/share-pages.json',JSON.stringify(pages));
const template=fs.readFileSync('public/index.html','utf8');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [route,slug,title,description] of pages){
 const url='https://www.dynastynba.com/'+slug;
 const fullTitle=title==='Dynasty NBA'?title:title+' | Dynasty NBA';
 let html=template.replace(/<title>.*?<\/title>/,`<title>${escape(fullTitle)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(description)}" />`).replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${url}" />`);
 const image='https://www.dynastynba.com/'+(route.startsWith('resources/tablet')?'tommy-reporter.jpg':'dynastynba-logo.jpg');
 html=html.replace('<head>','<head>\n  <base href="/" />\n'+`<meta property="og:type" content="${route.split('/').length>2?'article':'website'}" />\n<meta property="og:site_name" content="Dynasty NBA" />\n<meta property="og:title" content="${escape(fullTitle)}" />\n<meta property="og:description" content="${escape(description)}" />\n<meta property="og:url" content="${url}" />\n<meta property="og:image" content="${image}" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${escape(fullTitle)}" />\n<meta name="twitter:description" content="${escape(description)}" />\n<meta name="twitter:image" content="${image}" />\n<script>if(!location.hash)history.replaceState(null,'',location.pathname+location.search+'#'+${JSON.stringify(route)});</script>`);
 const out=slug?'public/'+slug+'.html':'public/index.html';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
}
console.log('Generated '+pages.length+' pages with crawler-readable sharing metadata.');
