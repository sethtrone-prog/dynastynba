// Calculate team-header competitive achievements from ESPN history instead of hard-coded totals.
(function(){
  const cache=new Map();
  const statsCache=new Map();
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const leagueSeasonNow=()=>{const d=new Date(),y=d.getFullYear();return d.getMonth()>=7?y+1:y;};
  const seasonYears=()=>{
    const dbYears=(typeof DB!=='undefined'&&DB?.Seasons||[]).map(x=>Number(x?.Workbook_Year)||Number(x?.End_Year)||Number(String(x?.Season_ID||'').replace('S',''))||0).filter(y=>y>=2019);
    const max=Math.max(leagueSeasonNow(),...dbYears,2019);
    return Array.from({length:max-2018},(_,i)=>2019+i);
  };
  async function loadSeason(y){
    if(cache.has(y))return cache.get(y);
    const p=fetch(`/api/espn-archive?season=${y}`).then(r=>r.json()).then(d=>d?.ok?d:null).catch(()=>null);
    cache.set(y,p);return p;
  }
  function currentEspnId(fid){
    const e=(typeof DB!=='undefined'&&DB?.['ESPN Teams']||[]).find(x=>x.Franchise_ID===fid)||{};
    for(const k of ['ESPN_Team_ID','ESPN_ID','Team_ID','teamId','id','ID']){const v=Number(e[k]);if(Number.isFinite(v)&&v>0)return v;}
    return null;
  }
  function franchiseTitle(fid){
    const e=(typeof DB!=='undefined'&&DB?.['ESPN Teams']||[]).find(x=>x.Franchise_ID===fid)||{};
    const f=(typeof DB!=='undefined'&&DB?.Franchises||[]).find(x=>x.Franchise_ID===fid)||{};
    return e.ESPN_Team_Name||f.Franchise_Name||f.Current_Owner||fid;
  }
  function workbookRosterNames(fid,y){
    const sid='S'+Number(y),players=typeof DB!=='undefined'?(DB?.Players||[]):[];
    return new Set((typeof DB!=='undefined'&&DB?.Rosters||[]).filter(r=>r.Franchise_ID===fid&&r.Season_ID===sid).map(r=>{
      const p=players.find(x=>x.Player_ID===r.Player_ID);return norm(p?.Player_Name||r.Player_Name_Raw||r.Player_Raw||'');
    }).filter(Boolean));
  }
  function rosterContinuityTeam(data,fid){
    const expected=workbookRosterNames(fid,data?.season);if(!expected.size)return null;
    let best=null,bestScore=0,bestRatio=0;
    for(const t of data?.teams||[]){
      const actual=new Set((t.roster||[]).map(p=>norm(p.name)).filter(Boolean));let score=0;
      for(const name of expected)if(actual.has(name))score++;
      const ratio=score/Math.max(1,Math.min(expected.size,actual.size));
      if(score>bestScore||(score===bestScore&&ratio>bestRatio)){best=t;bestScore=score;bestRatio=ratio;}
    }
    return bestScore>=3||bestRatio>=.3?best:null;
  }
  function findTeam(data,fid){
    if(!data)return null;
    if(String(fid).toUpperCase()==='F03'){
      const byRoster=rosterContinuityTeam(data,fid);if(byRoster)return byRoster;
    }
    const id=currentEspnId(fid);if(id!=null){const t=(data.teams||[]).find(x=>Number(x.id)===id);if(t)return t;}
    const title=norm(franchiseTitle(fid)),byName=(data.teams||[]).find(x=>norm(x.name)===title);if(byName)return byName;
    return rosterContinuityTeam(data,fid);
  }
  function winnerOf(m){
    if(!m?.home||!m?.away)return null;
    if(m.winner==='HOME')return Number(m.home.teamId);if(m.winner==='AWAY')return Number(m.away.teamId);
    const a=Number(m.home.score||0),b=Number(m.away.score||0);return a===b?null:(a>b?Number(m.home.teamId):Number(m.away.teamId));
  }
  function championship(data){
    const wb=(data?.playoffs||[]).filter(m=>!m.playoffTierType||m.playoffTierType==='WINNERS_BRACKET');if(!wb.length)return null;
    const max=Math.max(...wb.map(m=>Number(m.matchupPeriodId||0))),final=wb.find(m=>Number(m.matchupPeriodId||0)===max&&m.home&&m.away);if(!final)return null;
    return winnerOf(final);
  }
  function madePlayoffs(data,team){
    if(!data||!team)return false;
    const listed=(data.summary?.playoffTeams||[]).some(x=>Number(x.teamId)===Number(team.id));if(listed)return true;
    return (data.playoffs||[]).filter(m=>!m.playoffTierType||m.playoffTierType==='WINNERS_BRACKET').some(m=>Number(m.home?.teamId)===Number(team.id)||Number(m.away?.teamId)===Number(team.id));
  }
  async function calculate(fid){
    if(statsCache.has(fid))return statsCache.get(fid);
    const p=(async()=>{
      let championships=0,playoffs=0,W=0,L=0,T=0;
      for(const y of seasonYears()){
        const d=await loadSeason(y);if(!d)continue;
        const team=findTeam(d,fid);if(!team)continue;
        if(madePlayoffs(d,team))playoffs++;
        if(championship(d)===Number(team.id))championships++;
        for(const m of d.regularSeason||[]){
          let mine=null,opp=null;
          if(Number(m.home?.teamId)===Number(team.id)){mine=m.home;opp=m.away;}else if(Number(m.away?.teamId)===Number(team.id)){mine=m.away;opp=m.home;}else continue;
          const a=Number(mine?.score||0),b=Number(opp?.score||0);
          if(a>b)W++;else if(a<b)L++;else T++;
        }
      }
      return{championships,playoffs,W,L,T};
    })();statsCache.set(fid,p);return p;
  }
  function recordText(s){return `${s.W}-${s.L}${s.T?`-${s.T}`:''}`;}
  async function updateTeamHeader(){
    const parts=location.hash.replace(/^#/,'').split('/');if(parts[0]!=='team'||!parts[1])return;
    const fid=String(parts[1]).toUpperCase(),meta=document.querySelector('#app .team-command .team-command-meta');if(!meta)return;
    const spans=meta.querySelectorAll('span');if(spans.length<3)return;
    const s=await calculate(fid);if(location.hash.replace(/^#/,'').split('/')[1]?.toUpperCase()!==fid)return;
    spans[0].textContent=`${s.championships} ${s.championships===1?'CHAMPIONSHIP':'CHAMPIONSHIPS'}`;
    spans[1].textContent=`${s.playoffs} ${s.playoffs===1?'PLAYOFF APPEARANCE':'PLAYOFF APPEARANCES'}`;
    spans[2].textContent=`${recordText(s)} ALL-TIME REGULAR-SEASON RECORD`;
  }
  const app=document.getElementById('app');if(app)new MutationObserver(()=>{clearTimeout(window.__teamAchievementTimer);window.__teamAchievementTimer=setTimeout(updateTeamHeader,40);}).observe(app,{childList:true,subtree:true,characterData:true});
  window.addEventListener('hashchange',()=>setTimeout(updateTeamHeader,80));setTimeout(updateTeamHeader,140);
})();
