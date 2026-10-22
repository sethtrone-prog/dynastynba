import {put,head} from '@vercel/blob';
const path='scoreboard-beta/health/storage-test-v1.json';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({ok:false,error:'Blob storage token not configured'});
try{
 let created=false,alreadyExists=false;
 try{await put(path,JSON.stringify({kind:'storage-smoke-test',version:1}),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:false});created=true}
 catch(e){if(e?.name==='BlobAlreadyExistsError'||e?.code==='blob_already_exists'||/already exists/i.test(e?.message||''))alreadyExists=true;else throw e}
 const found=await head(path);
 res.json({ok:!!found,created,alreadyExists,readBack:!!found,pathname:found?.pathname||null,verifiedGameLocks:false,note:'This is a single fixed health-check record, not a player lock.'});
}catch(e){res.status(502).json({ok:false,error:'Blob storage test failed',detail:e.message})}
}