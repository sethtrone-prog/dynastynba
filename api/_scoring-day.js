// NBA scoring day rolls over at 3 AM Eastern; weekly matchups remain on their separate 4 AM boundary.
function scoringDate(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 const date=`${p.year}${p.month}${p.day}`;
 if(Number(p.hour)>=3)return date;
 const previous=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)-1));
 return previous.toISOString().slice(0,10).replace(/-/g,'');
}
module.exports={scoringDate};
