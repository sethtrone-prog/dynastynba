import crypto from 'node:crypto';

const RANGE = "'Transaction Log'!A2:E2090";
const DISPLAY_SEASON = 2027;

function clean(v){return String(v??'').trim();}
function value(row,col){return row?.[col]?.formattedValue??'';}
function b64url(input){return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}

async function getAccessToken(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g,'\n');
  if(!email||!privateKey) throw new Error('Google service account is not configured');
  const now=Math.floor(Date.now()/1000);
  const header=b64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const payload=b64url(JSON.stringify({iss:email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const unsigned=`${header}.${payload}`;
  const signature=crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey);
  const assertion=`${unsigned}.${b64url(signature)}`;
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  if(!response.ok) throw new Error(`Google OAuth returned ${response.status}`);
  const json=await response.json();
  if(!json.access_token) throw new Error('Google OAuth did not return an access token');
  return json.access_token;
}

async function fetchRows(sheetId,token){
  const fields='sheets(data(rowData(values(formattedValue))))';
  const url=new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`);
  url.searchParams.append('ranges',RANGE);
  url.searchParams.set('includeGridData','true');
  url.searchParams.set('fields',fields);
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});
  if(!response.ok) throw new Error(`Transaction Log: Google Sheets API returned ${response.status}`);
  const json=await response.json();
  return (json?.sheets?.[0]?.data?.[0]?.rowData||[]).map(row=>row.values||[]);
}

function parse(rows){
  const transactions=[];
  rows.forEach((row,index)=>{
    const date=clean(value(row,0));
    const team=clean(value(row,1));
    const type=clean(value(row,2));
    const asset=clean(value(row,3));
    const details=clean(value(row,4));
    if(index===0 && /^date$/i.test(date) && /^team$/i.test(team)) return;
    if(!date && !team && !type && !asset && !details) return;
    if(!team || !type || !asset) return;
    transactions.push({row:index+2,date,team,type,asset,details});
  });
  return transactions;
}

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=600, stale-while-revalidate=60');
  const sheetId=process.env.DYNASTY_SHEET_ID;
  if(!sheetId) return res.status(503).json({ok:false,message:'DYNASTY_SHEET_ID is not configured',refreshSeconds:600});
  try{
    const token=await getAccessToken();
    const rows=await fetchRows(sheetId,token);
    const transactions=parse(rows);
    return res.status(200).json({ok:true,displaySeason:DISPLAY_SEASON,refreshSeconds:600,generatedAt:new Date().toISOString(),transactions});
  }catch(error){
    return res.status(502).json({ok:false,refreshSeconds:600,message:error?.message||'Transaction sync failed'});
  }
}
