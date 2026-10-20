const fs=require('fs'),path=require('path');
const pages=JSON.parse(fs.readFileSync('public/share-pages.json','utf8'));
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
