import {getGoogleToken} from './_dynasty-sheet.js';

const CONSTITUTION_DOC_ID='1CIp8vhs0seaLvyr3_Nni3bmJIs4CbYBSleMKR2rbv7g';

function collectText(elements,out){
  for(const el of elements||[]){
    if(el.paragraph){
      let line='';
      for(const pe of el.paragraph.elements||[]) line+=pe.textRun?.content||'';
      line=line.replace(/\n$/,'');
      if(line.trim()) out.push(line);
    }
    if(el.table){
      for(const row of el.table.tableRows||[]) for(const cell of row.tableCells||[]) collectText(cell.content,out);
    }
    if(el.tableOfContents) collectText(el.tableOfContents.content,out);
  }
}

function extractDocumentText(doc){
  const out=[];
  if(Array.isArray(doc.tabs)&&doc.tabs.length){
    const walk=tabs=>{for(const tab of tabs||[]){collectText(tab.documentTab?.body?.content,out);walk(tab.childTabs)}};
    walk(doc.tabs);
  }else collectText(doc.body?.content,out);
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=60');
  try{
    const token=await getGoogleToken();
    const url=new URL(`https://docs.googleapis.com/v1/documents/${CONSTITUTION_DOC_ID}`);
    url.searchParams.set('includeTabsContent','true');
    const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});
    if(!response.ok) throw new Error(`Google Docs API returned ${response.status}`);
    const doc=await response.json();
    const text=extractDocumentText(doc);
    if(!text) throw new Error('Constitution document returned no readable text');
    return res.status(200).json({ok:true,title:doc.title||'Fantasy Constitution',revisionId:doc.revisionId||null,refreshSeconds:300,generatedAt:new Date().toISOString(),text});
  }catch(error){
    return res.status(502).json({ok:false,refreshSeconds:300,message:error?.message||'Google Doc sync failed'});
  }
}
