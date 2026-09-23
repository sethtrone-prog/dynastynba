import {getGoogleToken} from './_dynasty-sheet.js';

const CONSTITUTION_DOC_ID='1CIp8vhs0seaLvyr3_Nni3bmJIs4CbYBSleMKR2rbv7g';

function esc(s){return String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function cssColor(c){return c?.color?.rgbColor?Object.values(c.color.rgbColor).map(v=>Math.round((v||0)*255)):null}
function roman(n){const v=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let s='';for(const [x,r] of v)while(n>=x){s+=r;n-=x}return s}
function markerFor(type,n){if(type==='UPPER_ROMAN')return roman(n);if(type==='ROMAN')return roman(n).toLowerCase();if(type==='UPPER_ALPHA')return String.fromCharCode(64+n);if(type==='ALPHA')return String.fromCharCode(96+n);return String(n)}
function renderParagraph(p,ctx){
  const style=p.paragraphStyle||{},named=style.namedStyleType||'',align=style.alignment||'START',bullet=p.bullet||null;
  const pt=v=>v?.magnitude?`${v.magnitude}pt`:'';
  const pstyles=[`text-align:${align.toLowerCase()}`];if(style.indentStart?.magnitude)pstyles.push(`margin-left:${style.indentStart.magnitude}pt`);if(style.indentFirstLine?.magnitude)pstyles.push(`text-indent:${style.indentFirstLine.magnitude-style.indentStart?.magnitude||style.indentFirstLine.magnitude}pt`);if(style.lineSpacing)pstyles.push(`line-height:${style.lineSpacing/100}`);if(style.spaceAbove?.magnitude)pstyles.push(`margin-top:${style.spaceAbove.magnitude}pt`);if(style.spaceBelow?.magnitude)pstyles.push(`margin-bottom:${style.spaceBelow.magnitude}pt`);
  let html='';
  for(const pe of p.elements||[]){
    const tr=pe.textRun;if(!tr)continue;
    const s=tr.textStyle||{};let t=esc(tr.content||'').replace(/\n/g,'<br>');
    if(s.bold)t='<strong>'+t+'</strong>';if(s.italic)t='<em>'+t+'</em>';if(s.underline)t='<u>'+t+'</u>';
    const spans=[];if(s.fontSize?.magnitude)spans.push('font-size:'+s.fontSize.magnitude+s.fontSize.unit.toLowerCase());if(s.weightedFontFamily?.fontFamily)spans.push('font-family:'+JSON.stringify(s.weightedFontFamily.fontFamily));
    const col=cssColor(s.foregroundColor);if(col)spans.push('color:rgb('+col.join(',')+')');
    if(spans.length)t='<span style="'+spans.join(';')+'">'+t+'</span>';html+=t;
  }
  if(!html.replace(/<br>/g,'').trim())return '<div class="gdoc-space"></div>';
  const tag=/TITLE|SUBTITLE|HEADING_1/.test(named)?'h2':/HEADING_[23]/.test(named)?'h3':'div';
  const cls='gdoc-paragraph '+named.toLowerCase().replace(/_/g,'-')+(bullet?' gdoc-bullet level-'+(bullet.nestingLevel||0):'');
  let marker='';if(bullet){const level=bullet.nestingLevel||0,list=ctx?.lists?.[bullet.listId]?.listProperties?.nestingLevels?.[level],key=bullet.listId+':'+level;ctx.counts[key]=(ctx.counts[key]||((list?.startNumber||1)-1))+1;let m=markerFor(list?.glyphType,ctx.counts[key]);const fmt=list?.glyphFormat||'%'+level+'.';m=fmt.replace(new RegExp('%'+level,'g'),m);marker='<span class="gdoc-marker">'+esc(m)+'</span>'}
  return '<'+tag+' class="'+cls+'" style="'+pstyles.join(';')+'">'+marker+html+'</'+tag+'>';
}
function renderElements(elements,ctx){
  let out='';
  for(const el of elements||[]){
    if(el.paragraph)out+=renderParagraph(el.paragraph,ctx);
    if(el.table){out+='<table class="gdoc-table">';for(const row of el.table.tableRows||[]){out+='<tr>';for(const cell of row.tableCells||[])out+='<td>'+renderElements(cell.content,ctx)+'</td>';out+='</tr>'}out+='</table>'}
    if(el.tableOfContents)out+=renderElements(el.tableOfContents.content,ctx);
  }return out;
}
function extractDocument(doc){
  let html='',text=[];
  const collect=els=>{for(const el of els||[]){if(el.paragraph){let line='';for(const pe of el.paragraph.elements||[])line+=pe.textRun?.content||'';if(line.trim())text.push(line.replace(/\n$/,''))}if(el.table)for(const row of el.table.tableRows||[])for(const cell of row.tableCells||[])collect(cell.content)}};
  const use=(els,lists)=>{const ctx={lists:lists||{},counts:{}};html+=renderElements(els,ctx);collect(els)};
  if(Array.isArray(doc.tabs)&&doc.tabs.length){const walk=tabs=>{for(const tab of tabs||[]){use(tab.documentTab?.body?.content,tab.documentTab?.lists);walk(tab.childTabs)}};walk(doc.tabs)}else use(doc.body?.content,doc.lists);
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
