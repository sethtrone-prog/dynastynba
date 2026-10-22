import {list} from '@vercel/blob';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({ok:false,error:'Storage unavailable'});
 try{
  const result={ok:true,observations:0,provisionalLocks:0,latestObservation:null,byDate:{},verifiedGamesUsed:false};
  for(const [prefix,field] of [['scoreboard-beta/observations/','observations'],['scoreboard-beta/locks/','provisionalLocks']]){
   let cursor=null,pages=0;
   do{
    const page=await list({prefix,limit:1000,cursor:cursor||undefined,token:process.env.BLOB_READ_WRITE_TOKEN});
    for(const blob of page.blobs){
     result[field]++;
     const date=blob.pathname.split('/')[2]||'unknown';
     if(!result.byDate[date])result.byDate[date]={observations:0,provisionalLocks:0};
     result.byDate[date][field]++;
     if(field==='observations'&&(!result.latestObservation||blob.uploadedAt>result.latestObservation.uploadedAt))result.latestObservation={pathname:blob.pathname,uploadedAt:blob.uploadedAt};
    }
    cursor=page.hasMore?page.cursor:null;pages++;
   }while(cursor&&pages<20);
   if(cursor)result.ok=false;
  }
  result.note='Observations confirm durable snapshots, not verified player locks. No games-used totals published.';
  return res.status(result.ok?200:206).json(result);
 }catch(error){return res.status(502).json({ok:false,error:String(error.message||error)})}
}