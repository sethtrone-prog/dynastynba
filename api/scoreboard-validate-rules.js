// Beta-only: expose the actual ESPN schedule boundaries and cap settings for validation.
const ROOT='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2027/segments/0/leagues/76513288';
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 try{
 const r=await fetch(ROOT+'?view=mSettings&view=mStatus&view=mSchedule&view=mMatchupScore');
 if(!r.ok)throw Error('ESPN '+r.status);
 const d=await r.json();
 const s=d.settings||{},ss=s.scheduleSettings||{},rs=s.rosterSettings||{},st=d.status||{};
 const periods=ss.matchupPeriods||{};
 const bounds=Object.entries(periods).map(([id,days])=>({matchupPeriodId:Number(id),scoringPeriodIds:Array.isArray(days)?days:[],first:Array.isArray(days)?days[0]:null,last:Array.isArray(days)?days[days.length-1]:null}));
 const matchups=(d.schedule||[]).map(m=>({id:m.id,matchupPeriodId:m.matchupPeriodId,homeTeamId:m.home?.teamId,awayTeamId:m.away?.teamId,homeGamesPlayed:m.home?.gamesPlayed??null,awayGamesPlayed:m.away?.gamesPlayed??null,homeTotalPoints:m.home?.totalPoints??null,awayTotalPoints:m.away?.totalPoints??null}));
 const capCandidates={stat42ScoringItem:(s.scoringSettings?.scoringItems||[]).filter(x=>Number(x.statId)===42),allLineupStatLimits:rs.lineupSlotStatLimits??null,lineupSlotStatLimits:rs.lineupSlotStatLimits??null,lineupLocktimeType:rs.lineupLocktimeType??null,rosterLocktimeType:rs.rosterLocktimeType??null,periodTypeId:ss.periodTypeId??null,firstScoringPeriod:st.firstScoringPeriod??null,latestScoringPeriod:st.latestScoringPeriod??null,finalScoringPeriod:st.finalScoringPeriod??null,matchupPeriodCount:bounds.length,matchupPeriodLength:ss.matchupPeriodLength??null,matchupPeriodLengthType:ss.matchupPeriodLengthType??null,matchupPeriods:bounds,rosterSettings:{lineupSlotCounts:rs.lineupSlotCounts??null},scheduleSettingsKeys:Object.keys(ss),rosterSettingsKeys:Object.keys(rs),statusKeys:Object.keys(st),settingsKeys:Object.keys(s),scoringSettingsKeys:Object.keys(s.scoringSettings||{})};
 res.status(200).json({ok:true,verified:false,season:2027,currentScoringPeriod:st.currentScoringPeriod??d.scoringPeriodId??null,currentMatchupPeriod:st.currentMatchupPeriod??null,capCandidates,matchups:matchups.slice(0,60),note:'Inspect raw ESPN schedule boundaries and compare gamesPlayed (if present) to derived per-day counts. No cap lock order is asserted.'});
 }catch(e){res.status(502).json({ok:false,error:String(e.message).slice(0,180)});}
};