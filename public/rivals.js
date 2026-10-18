// Historical head-to-head results from the same ESPN archive used by League History.
(function(){
  const FIRST=2019,cache=new Map();
  
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentYear=()=>Math.max(2027,new Date().getUTCFullYear()+(new Date().getUTCMonth()>=8?1:0),Number(window.DYNASTY_LIVE_SHEET?.season)||0);
  const mapping={1:'F10',2:'F04',3:'F08',4:'F06',5:'F01',7:'F09',8:'F07',9:'F02',10:'F05'};
  function franchiseFor(id,year){if(Number(id)===(year<=2024?6:11))return 'F03';return mapping[Number(id)]||null;}
  function result(m){
    if(!m.home||!m.away)return null;
    // ESPN assigned results to canceled 2020 zero-score matchups.
    if(m.home.score!=null&&m.away.score!=null&&Number(m.home.score)===0&&Number(m.away.score)===0)return null;
    if(m.winner==='HOME')return 1;
    if(m.winner==='AWAY')return -1;
    // Never turn an undecided 0-0 future matchup into a tie.
    if(m.winner==='TIE')return 0;
    return null;
  }
  function summarize(seasons,fid,kind='regular'){
    const opponents=new Map(),missing=[];
    for(const d of seasons){
      if(!d?.ok){if(d?.season)missing.push(d.season);continue;}
      const items=kind==='regular'?(d.regularSeason||[]):kind==='playoffs'?(d.playoffs||[]).filter(m=>m.playoffTierType==='WINNERS_BRACKET'):[...(d.regularSeason||[]),...(d.playoffs||[]).filter(m=>m.playoffTierType==='WINNERS_BRACKET')];
      const seen=new Set();
      for(const m of items){
        const outcome=result(m);if(outcome===null)continue;
        const home=franchiseFor(m.home.teamId,d.season),away=franchiseFor(m.away.teamId,d.season);
        if(!home||!away||home===away){missing.push(d.season);continue;}
        if(home!==fid&&away!==fid)continue;
        const key=m.id!=null?String(m.id):`${m.matchupPeriodId}:${m.home.teamId}:${m.away.teamId}`;
        if(seen.has(key))continue;seen.add(key);
        const other=home===fid?away:home,sign=home===fid?1:-1;
        const row=opponents.get(other)||{fid:other,w:0,l:0,t:0,games:0,pf:0,pa:0,scored:0,margin:0};
        const own=sign===1?m.home:m.away,opp=sign===1?m.away:m.home;
        if(outcome===0)row.t++;else if(outcome*sign===1)row.w++;else row.l++;
        row.games++;
        if(own.score!=null&&opp.score!=null&&Number.isFinite(Number(own.score))&&Number.isFinite(Number(opp.score))){row.pf+=Number(own.score);row.pa+=Number(opp.score);row.margin+=Math.abs(Number(own.score)-Number(opp.score));row.scored++;}
        opponents.set(other,row);
      }
    }
    const rows=[...opponents.values()].map(r=>({...r,pct:(r.w+r.t/2)/r.games,closeness:Math.abs(r.w-r.l)/r.games,avgMargin:r.scored?r.margin/r.scored:null}));
    rows.sort((a,b)=>a.closeness-b.closeness||b.games-a.games||(a.avgMargin??Infinity)-(b.avgMargin??Infinity)||a.fid.localeCompare(b.fid));
    return {rows,missing:[...new Set(missing)].sort(),top:rows[0]||null};
  }
  function mutualPairs(data,franchiseIds){
    const ids=[...franchiseIds].sort();
    if(ids.length%2||data.some(d=>!d?.ok))return null;
    const pairs=new Map();let maxPlayoffs=0;
    for(let i=0;i<ids.length;i++){
      const regular=summarize(data,ids[i]),playoffs=summarize(data,ids[i],'playoffs');
      if(regular.missing.length||playoffs.missing.length)return null;
      for(let j=i+1;j<ids.length;j++){
        const r=regular.rows.find(r=>r.fid===ids[j]),p=playoffs.rows.find(r=>r.fid===ids[j]);
        const meetings=p?.games||0;maxPlayoffs=Math.max(maxPlayoffs,meetings);
        pairs.set(ids[i]+':'+ids[j],{a:ids[i],b:ids[j],balance:r?1-r.closeness:0,meetings,margin:r?.avgMargin??Infinity});
      }
    }
    if(![...pairs.values()].some(p=>p.balance>0||p.meetings>0))return null;
    for(const p of pairs.values())p.score=.7*p.balance+.3*(maxPlayoffs?p.meetings/maxPlayoffs:0);
    let best=null;
    function search(left,chosen,score,margin){
      if(!left.length){
        if(!best||score>best.score+1e-12||(Math.abs(score-best.score)<=1e-12&&margin<best.margin))best={pairs:chosen,score,margin};
        return;
      }
      const [a,...rest]=left;
      rest.forEach((b,i)=>{const p=pairs.get(a+':'+b);search(rest.filter((_,j)=>i!==j),[...chosen,p],score+p.score,margin+p.margin);});
    }
    search(ids,[],0,0);
    const out=new Map();
    for(const p of best?.pairs||[]){out.set(p.a,{fid:p.b,score:p.score*100});out.set(p.b,{fid:p.a,score:p.score*100});}
    return out;
  }
  // Expose the pure calculation for audits without relying on the page renderer.
  window.DynastyRivals={summarize,franchiseFor,result,mutualPairs};
  async function load(y){
    const prior=cache.get(y);if(prior&&prior.expires>Date.now())return prior.promise;
    const promise=fetch('/api/espn-archive?season='+y+(y>=currentYear()?'&rivalsRefresh='+Math.floor(Date.now()/300000):'')).then(r=>{if(!r.ok)throw new Error('Unavailable');return r.json();}).then(d=>{if(!d?.ok||Number(d.season)!==y||!Array.isArray(d.regularSeason)||!Array.isArray(d.teams))throw new Error('Invalid season');return d;}).catch(()=>{cache.delete(y);return {ok:false,season:y};});
    cache.set(y,{promise,expires:y<currentYear()?Infinity:Date.now()+300000});return promise;
  }
  const title=fid=>{
    const f=(typeof DB!=='undefined'?DB?.Franchises:[])?.find(f=>f.Franchise_ID===fid);
    return f?.Current_Owner||fid;
  };
  const record=r=>`${r.w}–${r.l}–${r.t}`;
  const number=v=>v==null?'—':Number(v).toLocaleString(undefined,{maximumFractionDigits:2});
  function draw(root,data,fid){
    const regular=summarize(data,fid,'regular'),playoffs=summarize(data,fid,'playoffs');
    const fids=(typeof DB!=='undefined'?DB?.Franchises:[])||[];
    const rival=mutualPairs(data,fids.map(f=>f.Franchise_ID))?.get(fid);
    const top=rival?regular.rows.find(r=>r.fid===rival.fid):null;
    const playoffRecord=rival?playoffs.rows.find(r=>r.fid===rival.fid):null;
    function table(summary,label){
      const rows=fids.filter(f=>f.Franchise_ID!==fid).map(f=>summary.rows.find(r=>r.fid===f.Franchise_ID)||{fid:f.Franchise_ID,w:0,l:0,t:0,games:0,pct:null,pf:null,pa:null,avgMargin:null});
      rows.sort((a,b)=>(b.pct??-1)-(a.pct??-1)||b.games-a.games||title(a.fid).localeCompare(title(b.fid)));
      return `<section class="card rivals-section"><div class="card-pad section-title"><h2>${label}</h2><span>Highest win percentage first</span></div><div class="table-wrap"><table class="data-table rivals-table"><thead><tr><th>Owner</th><th>W–L–T</th><th>Games</th><th>Win%</th><th>Points For</th><th>Points Against</th><th>Avg. Margin</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.fid===rival?.fid?'rivals-top-row':''}"><td><button class="inline-link" data-rival="${escape(r.fid)}">${escape(title(r.fid))}</button>${r.fid===rival?.fid?'<span class="rivals-tag">TOP RIVAL</span>':''}</td><td class="record">${record(r)}</td><td>${r.games}</td><td>${r.pct==null?'—':r.pct.toFixed(3)}</td><td>${number(r.pf)}</td><td>${number(r.pa)}</td><td>${number(r.avgMargin)}</td></tr>`).join('')}</tbody></table></div></section>`;
    }
    const loaded=data.filter(d=>d.ok).map(d=>d.season);
    root.innerHTML=`<div class="team-subhead"><div><div class="eyebrow">HEAD-TO-HEAD HISTORY</div><h2>Rivals</h2><p>Historical franchise records displayed by current owner</p></div></div>
    <section class="card rivals-highlight"><div class="card-pad"><div class="eyebrow">MUTUAL TOP RIVAL</div>${top?`<h2>${escape(title(top.fid))}</h2><div class="rivals-card-stats"><div><b>${record(top)}</b><span>Regular-season record</span></div><div><b>${record(playoffRecord||{w:0,l:0,t:0})}</b><span>Playoff record</span></div><div><b>${playoffRecord?.games||0}</b><span>Playoff meetings</span></div><div><b>${rival.score.toFixed(1)}<small> / 100</small></b><span>Rivalry score</span></div></div><button class="text-link" data-rival="${escape(top.fid)}">View opponent →</button>`:'<h2>Rivalry pairing unavailable</h2><p>Complete league history is required to assign consistent mutual rivals. Available results are shown below.</p>'}</div></section>
    <p class="note">Five mutual rivalry pairs are selected together using 70% regular-season balance and 30% playoff meeting frequency, scaled against the league’s highest meeting count. The pairing with the highest combined score wins; smaller average scoring margins break ties. Both tables highlight the same assigned rival. Records are W–L–T from this team’s perspective; owner changes remain part of the franchise’s history.</p>
    ${table(regular,'Regular Season')}${table(playoffs,'Playoffs')}
    <p class="note">ESPN seasons available: ${loaded.join(', ')||'none'}. Playoffs include championship-bracket games only; consolation games are excluded. Completed results only; future and canceled zero-score games excluded. Current-season requests refresh every five minutes while this tab is open.${regular.missing.length?' Unavailable or unmapped seasons: '+regular.missing.join(', ')+'. Totals exclude unavailable results.':''}</p>`;
    root.querySelectorAll('[data-rival]').forEach(button=>button.addEventListener('click',()=>go('team/'+button.dataset.rival+'/rivals')));
  }
  async function mount(fid){
    const content=document.querySelector('#app .content');if(!content)return;
    const root=document.createElement('div');root.id='rivalsRoot';content.replaceChildren(root);
    root.innerHTML='<div class="card"><div class="empty">Loading ESPN head-to-head history…</div></div>';
    const end=currentYear(),data=await Promise.all(Array.from({length:end-FIRST+1},(_,i)=>load(FIRST+i)));
    if(root.isConnected)draw(root,data,fid);
  }
  const original=window.teamPage;
  window.teamPage=function(fid,tab){
    const value=original.apply(this,arguments),tabs=document.querySelector('#app .team-tabs');
    if(tabs){const button=document.createElement('button');button.textContent='Rivals';button.className=tab==='rivals'?'active':'';button.addEventListener('click',()=>go('team/'+fid+'/rivals'));const history=[...tabs.querySelectorAll('button')].find(b=>b.textContent.trim().toLowerCase()==='history');tabs.insertBefore(button,history||null);}
    if(tab==='rivals')mount(fid);return value;
  };
  setInterval(()=>{const p=location.hash.slice(1).split('/');if(p[0]==='team'&&p[2]==='rivals')mount(p[1]);},300000);
  const style=document.createElement('style');style.textContent='.rivals-card-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin:22px 0}.rivals-card-stats b{display:block;font:700 30px Oswald,sans-serif;color:#c5a75a}.rivals-card-stats span{display:block;margin-top:6px;font-size:12px;color:#bdcbd9}.rivals-card-stats small{font:400 14px Arial,sans-serif;color:#bdcbd9}@media(max-width:650px){.rivals-card-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}.rivals-tag{display:inline-block;margin-left:14px;color:#ff38bc;font-weight:800;font-size:11px;letter-spacing:.06em;vertical-align:middle}.rivals-section{margin-bottom:24px}.rivals-highlight{margin-bottom:16px;border-color:rgba(197,167,90,.55)}.rivals-highlight h2{margin:8px 0}.rivals-record{font:700 38px Oswald,sans-serif;color:#c5a75a}.rivals-top-row{background:rgba(197,167,90,.08)}.rivals-table th,.rivals-table td{white-space:nowrap}.rivals-table th:not(:first-child),.rivals-table td:not(:first-child){text-align:center}#rivalsRoot .team-subhead{gap:16px;flex-wrap:wrap}#rivalsRoot select{margin-left:8px;padding:8px;background:#132338;color:inherit;border:1px solid #526078;border-radius:5px}';document.head.appendChild(style);
})();
