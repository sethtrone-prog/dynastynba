// Daily NBA display date rolls over at 3:00 AM America/Los_Angeles.
// Weekly fantasy matchup rollover is handled separately; do not change it here.
function scoringDate(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 const d=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)));
 if(Number(p.hour)<3)d.setUTCDate(d.getUTCDate()-1);
 return d.toISOString().slice(0,10).replace(/-/g,'');
}
// ESPN 2026-27 fantasy scoring period 1 begins October 20, 2026.
function scoringPeriodForDate(date){
 if(!/^\\d{8}$/.test(date))return NaN;
 const t=Date.UTC(Number(date.slice(0,4)),Number(date.slice(4,6))-1,Number(date.slice(6,8)));
 return Math.round((t-Date.UTC(2026,9,20))/86400000)+1;
}
module.exports={scoringDate,scoringPeriodForDate};
