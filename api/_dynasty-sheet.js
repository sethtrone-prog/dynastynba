import crypto from 'node:crypto';

function b64url(input){return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}

export async function getGoogleToken(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g,'\n');
  if(!email||!privateKey)throw new Error('Google service account is not configured');
  const now=Math.floor(Date.now()/1000);
  const header=b64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const payload=b64url(JSON.stringify({
    iss:email,
    scope:'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
    aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600
  }));
  const unsigned=`${header}.${payload}`;
  const signature=crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey);
  const assertion=`${unsigned}.${b64url(signature)}`;
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  if(!response.ok)throw new Error(`Google OAuth returned ${response.status}`);
  const json=await response.json();if(!json.access_token)throw new Error('Google OAuth did not return an access token');return json.access_token;
}

function seasonFromName(name){const m=String(name||'').match(/Dynasty\s+League\s+(20\d{2})/i);return m?Number(m[1]):null;}

async function discoverNewestWorkbook(token){
  const q="mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and name contains 'Dynasty League'";
  const url=new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q',q);url.searchParams.set('fields','files(id,name,modifiedTime)');url.searchParams.set('pageSize','100');
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});if(!response.ok)return null;
  const json=await response.json();
  const candidates=(json.files||[]).map(f=>({...f,season:seasonFromName(f.name)})).filter(f=>f.season).sort((a,b)=>b.season-a.season||String(b.modifiedTime).localeCompare(String(a.modifiedTime)));
  return candidates[0]||null;
}

async function spreadsheetMeta(id,token){
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?fields=spreadsheetId,properties(title)`;
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});if(!response.ok)return null;
  const json=await response.json();return{sheetId:json.spreadsheetId||id,title:json.properties?.title||'',season:seasonFromName(json.properties?.title)};
}

export async function resolveDynastyWorkbook(token){
  // Prefer automatic Drive discovery. If Drive metadata access is unavailable,
  // retain the configured sheet as a safe fallback.
  const discovered=await discoverNewestWorkbook(token).catch(()=>null);
  if(discovered)return{sheetId:discovered.id,title:discovered.name,season:discovered.season,source:'drive'};
  const configured=process.env.DYNASTY_SHEET_ID;
  if(!configured)throw new Error('No Dynasty League workbook is available');
  const meta=await spreadsheetMeta(configured,token).catch(()=>null);
  return{sheetId:configured,title:meta?.title||'',season:meta?.season||Number(process.env.DYNASTY_SEASON)||2027,source:'configured'};
}

export function contractYears(season,count=5){return Array.from({length:count},(_,i)=>`${season-1+i}-${season+i}`);}
