import {getGoogleToken} from './_dynasty-sheet.js';

const CONSTITUTION_DOC_ID='1CIp8vhs0seaLvyr3_Nni3bmJIs4CbYBSleMKR2rbv7g';

function esc(s){return String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function cssColor(c){return c?.color?.rgbColor?Object.values(c.color.rgbColor).map(v=>Math.round((v||0)*255)):null}
function renderParagraph(p){
  const style=p.paragraphStyle||{},named=style.namedStyleType||'',align=style.alignment||'START';
  let html='';
  for(const pe of p.elements||[]){
    const tr=pe.textRun;if(!tr)continue;
    const s=tr.textStyle||{};let t=esc(tr.content||'').replace(/\n/g,'<br>');
    if(s.bold)t='<strong>'+t+'</strong>';if(s.italic)t='<em>'+t+'</em>';if(s.underline)t='<u>'+t+'</u>';
    const spans=[];if(s.fontSize?.magnitude)spans.push('font-size:'+s.fontSize.magnitude+s.fontSize.unit.toLowerCase());
    const col=cssColor(s.foregroundColor);if(col)spans.push('color:rgb('+col.join(',')+')');
    if(spans.length)t='<span style="'+spans.join(';')+'">'+t+'</span>';html+=t;
  }
  if(!html.replace(/<br>/g,'').trim())return '<div class="gdoc-space"></div>';
  const tag=/TITLE|SUBTITLE|HEADING_1/.test(named)?'h2':/HEADING_[23]/.test(named)?'h3':'div';
  const cls='gdoc-paragraph '+named.toLowerCase().replace(/_/g,'-');
  return '<'+tag+' class="'+cls+'" style="text-align:'+align.toLowerCase()+'">'+html+'</'+tag+'>';
}
function renderElements(elements){
  let out='';
  for(const el of elements||[]){
    if(el.paragraph)out+=renderParagraph(el.paragraph);
    if(el.table){out+='<table class="gdoc-table">';for(const row of el.table.tableRows||[]){out+='<tr>';for(const cell of row.tableCells||[])out+='<td>'+renderElements(cell.content)+'</td>';out+='</tr>'}out+='</table>'}
    if(el.tableOfContents)out+=renderElements(el.tableOfContents.content);
  }return out;
}
function extractDocument(doc){
  let html='',text=[];
  const collect=els=>{for(const el of els||[]){if(el.paragraph){let line='';for(const pe of el.paragraph.elements||[])line+=pe.textRun?.content||'';if(line.trim())text.push(line.replace(/\n$/,''))}if(el.table)for(const row of el.table.tableRows||[])for(const cell of row.tableCells||[])collect(cell.content)}};
  const use=els=>{html+=renderElements(els);collect(els)};
  if(Array.isArray(doc.tabs)&&doc.tabs.length){const walk=tabs=>{for(const tab of tabs||[]){use(tab.documentTab?.body?.content);walk(tab.childTabs)}};walk(doc.tabs)}else use(doc.body?.content);
  return {html,text:text.join('\n').trim()};
}

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=60');
  try{
    const token=await getGoogleToken();
    const url=new URL(`https://docs.googleapis.com/v1/documents/${CONSTITUTION_DOC_ID}`);
    url.searchParams.set('includeTabsContent','true');
    const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});
    if(!response.ok){const detail=await response.text().catch(()=> '');throw new Error(`Google Docs API returned ${response.status}: ${detail.slice(0,500)}`);}
    const doc=await response.json();
    const rendered=extractDocument(doc);
    if(!rendered.text) throw new Error('Constitution document returned no readable text');
    return res.status(200).json({ok:true,title:doc.title||'Fantasy Constitution',revisionId:doc.revisionId||null,refreshSeconds:900,generatedAt:new Date().toISOString(),text:rendered.text,html:rendered.html});
  }catch(error){
    return res.status(502).json({ok:false,refreshSeconds:900,message:error?.message||'Google Doc sync failed'});
  }
}
