// Historical head-to-head results from the same ESPN archive used by League History.
(function(){
  const FIRST=2019,cache=new Map();
  let mode='regular';
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentYear=()=>Math.max(2027,new Date().getUTCFullYear()+(new Date().getUTCMonth()>=8?1:0),Number(window.DYNASTY_LIVE_SHEET?.season)||0);
  const mapping={1:'F10',2:'F04',3:'F08',4:'F06',5:'F01',7:'F09',8:'F07',9:'F02',10:'F05'};
  function franchiseFor(id,year){if(Number(id)===(year<=2024?6:11))return 'F03';return mapping[Number(id)]||null;}
  function result(m){
    if(!m.home||!m.away)return null;
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
  // Expose the pure calculation for audits without relying on the page renderer.
  window.DynastyRivals={summarize,franchiseFor,result};
  async function load(y){
    const prior=cache.get(y);if(prior&&prior.expires>Date.now())return prior.promise;
    const promise=fetch('/api/espn-archive?season='+y+(y>=currentYear()?'&rivalsRefresh='+Math.floor(Date.now()/300000):'')).then(r=>{if(!r.ok)throw new Error('Unavailable');return r.json();}).then(d=>{if(!d?.ok||Number(d.season)!==y||!Array.isArray(d.regularSeason)||!Array.isArray(d.teams))throw new Error('Invalid season');return d;}).catch(()=>{cache.delete(y);return {ok:false,season:y};});
    cache.set(y,{promise,expires:y<currentYear()?Infinity:Date.now()+300000});return promise;
  }
  const title=fid=>typeof franchiseLabel==='function'?franchiseLabel(fid):fid;
  const record=r=>`${r.w}–${r.l}–${r.t}`;
  const number=v=>v==null?'—':Number(v).toLocaleString(undefined,{maximumFractionDigits:2});
  function draw(root,data,fid){
    const summary=summarize(data,fid,mode),top=summary.top;
    const fids=(typeof DB!=='undefined'?DB?.Franchises:[])||[];
    const rows=fids.filter(f=>f.Franchise_ID!==fid).map(f=>summary.rows.find(r=>r.fid===f.Franchise_ID)||{fid:f.Franchise_ID,w:0,l:0,t:0,games:0,pct:null,pf:null,pa:null,avgMargin:null});
    rows.sort((a,b)=>b.games-a.games||title(a.fid).localeCompare(title(b.fid)));
    const loaded=data.filter(d=>d.ok).map(d=>d.season),scope=mode==='regular'?'Regular season':mode==='playoffs'?'Championship-bracket playoffs':'Regular season + championship-bracket playoffs';
    root.innerHTML=`<div class="team-subhead"><div><div class="eyebrow">HEAD-TO-HEAD HISTORY</div><h2>Rivals</h2><p>${escape(scope)} · franchise history across owner and team-name changes</p></div><label>Matchups <select id="rivalsMode"><option value="regular" ${mode==='regular'?'selected':''}>Regular season</option><option value="playoffs" ${mode==='playoffs'?'selected':''}>Championship playoffs</option><option value="combined" ${mode==='combined'?'selected':''}>Combined</option></select></label></div>
    <section class="card rivals-highlight"><div class="card-pad"><div class="eyebrow">TOP RIVAL${summary.missing.length?' · AVAILABLE DATA':''}</div>${top?`<h2>${escape(title(top.fid))}</h2><div class="rivals-record">${record(top)}</div><p>${top.games} matchups · ${(top.pct*100).toFixed(1)}% win rate</p><button class="text-link" data-rival="${escape(top.fid)}">View opponent →</button>`:'<h2>No completed matchups</h2><p>A top rival appears once ESPN reports completed games for this selection.</p>'}</div></section>
    <p class="note">Top Rival is the record closest to .500, counting ties as half a win. Ties are broken by more matchups, then the smaller average scoring margin. Playoff views exclude consolation games. Records below are W–L–T from this team’s perspective.</p>
    <section class="card"><div class="table-wrap"><table class="data-table rivals-table"><thead><tr><th>Opponent</th><th>W–L–T</th><th>Games</th><th>Win%</th><th>Points For</th><th>Points Against</th><th>Avg. Margin</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.fid===top?.fid?'rivals-top-row':''}"><td><button class="inline-link" data-rival="${escape(r.fid)}">${escape(title(r.fid))}</button>${r.fid===top?.fid?'<small class="subline">TOP RIVAL</small>':''}</td><td class="record">${record(r)}</td><td>${r.games}</td><td>${r.pct==null?'—':r.pct.toFixed(3)}</td><td>${number(r.pf)}</td><td>${number(r.pa)}</td><td>${number(r.avgMargin)}</td></tr>`).join('')}</tbody></table></div></section>
    <p class="note">ESPN seasons available: ${loaded.join(', ')||'none'}. Completed results only; no future games counted. Current-season requests refresh every five minutes while this tab is open.${summary.missing.length?' Unavailable or unmapped seasons: '+summary.missing.join(', ')+'. Totals exclude unavailable results.':''}</p>`;
    root.querySelector('#rivalsMode').addEventListener('change',e=>{mode=e.target.value;draw(root,data,fid);});
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
    if(tabs){const button=document.createElement('button');button.textContent='Rivals';button.className=tab==='rivals'?'active':'';button.addEventListener('click',()=>go('team/'+fid+'/rivals'));tabs.appendChild(button);}
    if(tab==='rivals')mount(fid);return value;
  };
  setInterval(()=>{const p=location.hash.slice(1).split('/');if(p[0]==='team'&&p[2]==='rivals')mount(p[1]);},300000);
  const style=document.createElement('style');style.textContent='.rivals-highlight{margin-bottom:16px;border-color:rgba(197,167,90,.55)}.rivals-highlight h2{margin:8px 0}.rivals-record{font:700 38px Oswald,sans-serif;color:#c5a75a}.rivals-top-row{background:rgba(197,167,90,.08)}.rivals-table th,.rivals-table td{white-space:nowrap}.rivals-table th:not(:first-child),.rivals-table td:not(:first-child){text-align:center}#rivalsRoot .team-subhead{gap:16px;flex-wrap:wrap}#rivalsRoot select{margin-left:8px;padding:8px;background:#132338;color:inherit;border:1px solid #526078;border-radius:5px}';document.head.appendChild(style);
})();
