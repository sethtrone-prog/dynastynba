import {getGoogleToken,resolveDynastyWorkbook} from './_dynasty-sheet.js';

const clean=v=>String(v??'').trim();

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  try{
    const token=await getGoogleToken();
    const workbook=await resolveDynastyWorkbook(token);
    const range="'Calendar'!A1:B100";
    const url=new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(workbook.sheetId)}/values/${encodeURIComponent(range)}`);
    url.searchParams.set('majorDimension','ROWS');
    const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});
    if(!response.ok)throw new Error(`Calendar: Google Sheets API returned ${response.status}`);
    const json=await response.json();
    const calendar=(json.values||[]).map(r=>({date:clean(r[0]),event:clean(r[1])})).filter(x=>x.date&&x.event&&!/^list of events$/i.test(x.date));
    return res.status(200).json({ok:true,season:workbook.season||2027,workbookTitle:workbook.title,generatedAt:new Date().toISOString(),calendar});
  }catch(error){
    return res.status(502).json({ok:false,message:error?.message||'Calendar sync failed'});
  }
}