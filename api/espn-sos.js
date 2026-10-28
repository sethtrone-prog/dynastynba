const BASE='https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba';
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=120');
 const year=Number(req.query.season);
 if(!Number.isInteger(year)||year<2027||year>new Date().getUTCFullYear()+2)return res.status(400).json({ok:false,error:'Invalid season'});
 try{
  const url=BASE+'/seasons/'+year+'/segments/0/leagues/76513288?view=mMatchupScore&view=mTeam&view=mStandings';
  const response=await fetch(url,{headers:{'User-Agent':'DynastyNBA SOS'}});
  if(!response.ok)throw Error('ESPN unavailable');
  const data=await response.json();
  const teams=data.teams||[],schedule=data.schedule||[];
  const records=new Map(teams.map(t=>[Number(t.id),t.record?.overall||{}]));
  const totals=new Map(teams.map(t=>[Number(t.id),{id:Number(t.id),pa:0,played:0,opponentWins:0,opponentGames:0}]));
  for(const m of schedule){
   if(!m.home?.teamId||!m.away?.teamId||m.winner==='UNDECIDED'||!['HOME','AWAY','TIE'].includes(m.winner))continue;
   const h=totals.get(Number(m.home.teamId)),a=totals.get(Number(m.away.teamId));
   if(!h||!a||!Number.isFinite(Number(m.home.totalPoints))||!Number.isFinite(Number(m.away.totalPoints)))continue;
   for(const [team,opp,points] of [[h,a,m.away.totalPoints],[a,h,m.home.totalPoints]]){
    team.pa+=Number(points);team.played++;
    const r=records.get(opp.id)||{},w=Number(r.wins)||0,l=Number(r.losses)||0,t=Number(r.ties)||0;
    team.opponentWins+=w+t/2;team.opponentGames+=w+l+t;
   }
  }
  const rows=[...totals.values()].map(t=>({...t,traditional:t.opponentGames?t.opponentWins/t.opponentGames:null,fantasy:t.played?t.pa/t.played:null}));
  const rank=(key)=>[...rows].filter(r=>r[key]!==null).sort((a,b)=>b[key]-a[key]).forEach((r,i)=>{r[key+'Rank']=1+rows.filter(x=>x[key]!==null&&x[key]>r[key]).length});
  rank('traditional');rank('fantasy');
  rows.forEach(r=>r.averageRank=r.traditionalRank&&r.fantasyRank?(r.traditionalRank+r.fantasyRank)/2:null);
  rows.sort((a,b)=>(a.averageRank??Infinity)-(b.averageRank??Infinity)||(a.fantasyRank??Infinity)-(b.fantasyRank??Infinity)||(a.traditionalRank??Infinity)-(b.traditionalRank??Infinity)||a.id-b.id);
  rows.forEach((r,i)=>r.sosRank=r.averageRank===null?null:i+1);
  res.json({ok:true,season:year,completedMatchups:schedule.filter(m=>['HOME','AWAY','TIE'].includes(m.winner)).length,teams:rows});
 }catch(e){res.status(502).json({ok:false,error:'Unable to verify ESPN matchup results'});}
}