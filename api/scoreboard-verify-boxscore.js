// Independent ESPN boxscore cross-check for beta daily games-used counts.
const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 const day=Number(req.query.day||1);
 if(!Number.isInteger(day)||day<1||day>250)return res.status(400).json({ok:false,error:'Invalid day'});
 try{
  const u=BASE+'?view=mBoxscore&view=mMatchupScore&view=mSettings&scoringPeriodId='+day;
  const r=await fetch(u);
  if(!r.ok)throw Error('ESPN '+r.status);
  const d=await r.json();
  const slots=d.settings?.rosterSettings?.lineupSlotCounts||{};
  const schedule=(d.schedule||[]).filter(m=>Number(m.matchupPeriodId)===Number(req.query.period||1));
  const teams=[];
  for(const m of schedule)for(const side of ['home','away']){
   const t=m[side]||{};
   const entries=t.rosterForCurrentScoringPeriod?.entries||[];
   teams.push({teamId:t.teamId,matchupId:m.id,side,entryCount:entries.length,players:entries.map(e=>({playerId:e.playerId??e.playerPoolEntry?.player?.id,name:e.playerPoolEntry?.player?.fullName,slot:e.lineupSlotId,appliedStatTotal:e.playerPoolEntry?.appliedStatTotal??null,periodStats:(e.playerPoolEntry?.player?.stats||[]).filter(s=>Number(s.scoringPeriodId)===day&&Number(s.statSourceId)===0).map(s=>({split:s.statSplitTypeId,appliedTotal:s.appliedTotal,stats:s.stats}))}))});
  }
  res.status(200).json({ok:true,verified:false,day,period:Number(req.query.period||1),rosterSlotCounts:slots,matchupCount:schedule.length,teams,note:'Independent boxscore diagnostic; compare player IDs, lineup slots and official applied points against mRoster candidate list.'});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};