// Daily NBA display date follows Pacific midnight (3 AM Eastern), including DST.
// Weekly matchup boundaries remain independently at 4 AM Eastern.
function scoringDate(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return p.year+p.month+p.day;
}
// ESPN 2026-27 fantasy scoring period 1 begins October 20, 2026.
function scoringPeriodForDate(date){
 if(!/^\\d{8}$/.test(date))return NaN;
 const t=Date.UTC(Number(date.slice(0,4)),Number(date.slice(4,6))-1,Number(date.slice(6,8)));
 return Math.round((t-Date.UTC(2026,9,20))/86400000)+1;
}
module.exports={scoringDate,scoringPeriodForDate};
