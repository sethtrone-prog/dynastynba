// 2027 corrected team cap sheets imported from the user-maintained workbook.
// Applies the same cap/TW/G-League presentation to all ten franchises.
(function () {
  const TEST_SEASON = 2027;
  const YEARS = ['2026-2027','2027-2028','2028-2029','2029-2030','2030-2031'];
  const TEAM_CAP_DATA = {"F01":{"sheet":"Andrew Cap","main":[{"slot":"1.0","display":"Kawhi Leonard - NT 12/15","units":[4.0,null,null,null,null]},{"slot":"2.0","display":"Lebron James - NT 12/15","units":[4.0,null,null,null,null]},{"slot":"3.0","display":"Chet Holmgren RME - NT 12/15","units":[3.0,3.0,3.0,null,null]},{"slot":"4.0","display":"Devin Vassell PRME","units":[2.0,null,null,null,null]},{"slot":"5.0","display":"Derrick White","units":[2.0,null,null,null,null]},{"slot":"6.0","display":"Michael Porter Jr.","units":[2.0,null,null,null,null]},{"slot":"7.0","display":"Patrick Williams","units":[1.0,null,null,null,null]},{"slot":"8.0","display":"Alex Sarr PRME","units":[1.0,1.0,null,null,null]},{"slot":"9.0","display":"Donovan Clingan PRME","units":[1.0,1.0,null,null,null]},{"slot":"10.0","display":"Victor Wembanyama RME","units":[1.0,null,null,null,null]},{"slot":"TW","display":"Dylan Harper","units":[1.0,1.0,1.0,null,null]},{"slot":"TW","display":"Ace Bailey","units":[1.0,1.0,1.0,null,null]}],"totals":[21,5,3,0,0],"gLeague":[{"display":"Kingston Flemings PRME (0 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"Sergio De Larrea PRME (0 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"","units":[null,null,null,null,null]},{"display":"","units":[null,null,null,null,null]},{"display":"","units":[null,null,null,null,null]}]},"F02":{"sheet":"Brandon Cap","main":[{"slot":"1.0","display":"Jalen Brunson - NT 12/15/2026","units":[4.0,4.0,4.0,null,null]},{"slot":"2.0","display":"Devin Booker* - NT 12/15/2028","units":[3.0,3.0,3.0,3.0,null]},{"slot":"3.0","display":"Zion Williamson - NT 12/15/2027","units":[3.0,3.0,3.0,3.0,null]},{"slot":"4.0","display":"Jalen Williams - NT 12/15","units":[3.0,3.0,null,null,null]},{"slot":"5.0","display":"Stephen Curry","units":[3.0,3.0,null,null,null]},{"slot":"6.0","display":"Coby White","units":[2.0,2.0,null,null,null]},{"slot":"7.0","display":"Payton Pritchard","units":[1.0,1.0,null,null,null]},{"slot":"8.0","display":"Mikal Bridges","units":[1.0,1.0,null,null,null]},{"slot":"9.0","display":"Reed Sheppard PRME","units":[1.0,1.0,null,null,null]},{"slot":"10.0","display":"Toumani Camara","units":[1.0,null,null,null,null]},{"slot":"11.0","display":"Brandon Miller","units":[1.0,1.0,null,null,null]},{"slot":"TW","display":"Darius Acuff Jr. PRME (0 games)","units":[1.0,1.0,1.0,1.0,null]},{"slot":"TW","display":"Will Riley (74 games)","units":[1.0,1.0,1.0,null,null]},{"slot":"TW","display":"Nique Clifford PRME (75 games)","units":[1.0,1.0,1.0,null,null]}],"totals":[23,22,10,6,0],"gLeague":[{"display":"Carter Bryant PRME (25 games)","units":[1.0,1.0,1.0,null,null]},{"display":"","units":[null,null,null,null,null]},{"display":"","units":[null,null,null,null,null]},{"display":"","units":[null,null,null,null,null]},{"display":"","units":[null,null,null,null,null]}]},"F03":{"sheet":"Jake Cap","main":[{"slot":"1.0","display":"Paolo Banchero RME","units":[2.0,2.0,2.0,2.0,null]},{"slot":"2.0","display":"DeAndre Ayton","units":[2.0,2.0,null,null,null]},{"slot":"3.0","display":"Myles Turner","units":[2.0,null,null,null,null]},{"slot":"4.0","display":"Zach Lavine","units":[2.0,null,null,null,null]},{"slot":"5.0","display":"Cam Thomas","units":[2.0,null,null,null,null]},{"slot":"6.0","display":"Shaedon Sharpe","units":[2.0,2.0,2.0,2.0,null]},{"slot":"7.0","display":"Jabari Smith Jr.","units":[1.0,1.0,1.0,null,null]},{"slot":"8.0","display":"Peyton Watson","units":[1.0,1.0,1.0,null,null]},{"slot":"9.0","display":"Aaron Nesmith","units":[1.0,1.0,null,null,null]},{"slot":"10.0","display":"Jared McCain","units":[1.0,1.0,null,null,null]},{"slot":"11.0","display":"Keyonte George PRME","units":[1.0,null,null,null,null]},{"slot":"12.0","display":"Dereck Lively","units":[1.0,null,null,null,null]},{"slot":"13.0","display":"Ajay Mitchell","units":[1.0,1.0,null,null,null]},{"slot":"14.0","display":"Jaylen Wells","units":[1.0,1.0,null,null,null]},{"slot":"","display":"Keldon Johnson","units":[1.0,null,null,null,null]},{"slot":"TW","display":"Khaman Maluach PRME (46 g)","units":[1.0,1.0,1.0,1.0,null]}],"totals":[21,12,6,4,0],"gLeague":[{"display":"Walter Clayton Jr. PRME (69 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Thomas Sorber PRME","units":[1.0,1.0,1.0,null,null]},{"display":"Cedric Coward (62 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Hannes Steinbach","units":[1.0,1.0,1.0,1.0,null]},{"display":"","units":[null,null,null,null,null]}]},"F04":{"sheet":"Jordan F Cap","main":[{"slot":"1.0","display":"Kyrie Irving","units":[3.0,3.0,null,null,null]},{"slot":"2.0","display":"Tyrese Maxey RME","units":[2.0,2.0,null,null,null]},{"slot":"3.0","display":"Josh Giddey","units":[2.0,2.0,null,null,null]},{"slot":"4.0","display":"DeMar DeRozan","units":[2.0,null,null,null,null]},{"slot":"5.0","display":"Julius Randle","units":[2.0,null,null,null,null]},{"slot":"6.0","display":"Jonathan Kuminga PRME","units":[1.0,1.0,null,null,null]},{"slot":"7.0","display":"VJ Edgecombe PRME","units":[1.0,1.0,1.0,null,null]},{"slot":"8.0","display":"Ron Holland II PRME (159 g)","units":[1.0,1.0,null,null,null]},{"slot":"9.0","display":"Ausar Thompson  PRME","units":[1.0,null,null,null,null]},{"slot":"10.0","display":"Brandin Podziemski PRME","units":[1.0,null,null,null,null]},{"slot":"TW","display":"Collin Murray-Boyles PRME (57 games)","units":[1.0,1.0,1.0,null,null]},{"slot":"TW","display":"Zach Edey PRME (77 games)","units":[1.0,1.0,null,null,null]},{"slot":"TW","display":"Derik Queen PRME (81 games","units":[1.0,1.0,1.0,null,null]}],"totals":[16,10,1,0,0],"gLeague":[{"display":"Kasparas Jakucionis (53 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Nikola Topic PRME (10 games)","units":[1.0,1.0,null,null,null]},{"display":"Yaxel Landeborg","units":[1.0,1.0,1.0,1.0,null]},{"display":"Keaton Wagler","units":[1.0,1.0,1.0,1.0,null]},{"display":"Dailyn Swain","units":[1.0,1.0,1.0,1.0,null]}]},"F05":{"sheet":"Derek Cap","main":[{"slot":"1.0","display":"Nikola Jokic* - NT 12/15/27","units":[5.0,5.0,5.0,5.0,null]},{"slot":"2.0","display":"Cade Cunningham - NT 12/15/26","units":[3.0,3.0,3.0,null,null]},{"slot":"3.0","display":"Anthony Edwards RME","units":[3.0,3.0,null,null,null]},{"slot":"4.0","display":"Trae Young*","units":[3.0,3.0,null,null,null]},{"slot":"5.0","display":"Alperen Sengun - NT 12/15/26","units":[2.0,2.0,2.0,null,null]},{"slot":"6.0","display":"Jarrett Allen","units":[2.0,null,null,null,null]},{"slot":"7.0","display":"Jaylon Tyson","units":[1.0,1.0,null,null,null]}],"totals":[19,17,10,5,0],"gLeague":[{"display":"Terrence Shannon Jr. PRME (75 games)","units":[1.0,1.0,null,null,null]},{"display":"Bobi Klintman (20 games)","units":[1.0,1.0,null,null,null]},{"display":"Noah Penda (59 games)","units":[1.0,1.0,1.0,null,null]},{"display":"AJ Johnson (77 games)","units":[1.0,1.0,null,null,null]},{"display":"Mikel Brown","units":[1.0,1.0,1.0,1.0,null]}]},"F06":{"sheet":"J & Js Cap","main":[{"slot":"1.0","display":"Evan Mobley PRME - NT 12/15/26","units":[3.0,3.0,3.0,null,null]},{"slot":"2.0","display":"Darius Garland","units":[3.0,3.0,3.0,null,null]},{"slot":"3.0","display":"De'Aaron Fox*","units":[3.0,3.0,null,null,null]},{"slot":"4.0","display":"Bam Adebayo","units":[2.0,2.0,null,null,null]},{"slot":"5.0","display":"Jalen Green PRME","units":[2.0,2.0,null,null,null]},{"slot":"6.0","display":"Naz Reid","units":[1.0,null,null,null,null]},{"slot":"7.0","display":"Kyshawn George","units":[1.0,1.0,null,null,null]},{"slot":"8.0","display":"Anthony Black PRME","units":[1.0,null,null,null,null]},{"slot":"9.0","display":"Cason Wallace","units":[1.0,null,null,null,null]},{"slot":"10.0","display":"Scoot Henderson","units":[1.0,null,null,null,null]},{"slot":"11.0","display":"AJ Dybantsa","units":[1.0,1.0,1.0,1.0,null]},{"slot":"12.0","display":"Cameron Boozer","units":[1.0,1.0,1.0,1.0,null]},{"slot":"TW","display":"Egor Demin PRME (52 games)","units":[1.0,1.0,1.0,null,null]},{"slot":"TW","display":"Joan Beringer (40 games)","units":[1.0,1.0,1.0,null,null]},{"slot":"TW","display":"Brayden Burries","units":[1.0,1.0,1.0,1.0,null]}],"totals":[20,16,8,2,0],"gLeague":[{"display":"Yang Hansen PRME (43 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Ryan Kalkbrenner (69 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Javon Small (41 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Aday Mara","units":[1.0,1.0,1.0,1.0,null]},{"display":"Ebuka Okorie","units":[1.0,1.0,1.0,1.0,null]}]},"F07":{"sheet":"Diaz Cap","main":[{"slot":"1.0","display":"Shai Gilgeous-Alexander - NT 12/15/28","units":[4.0,4.0,4.0,4.0,null]},{"slot":"2.0","display":"Jalen Duren RME - NT 12/15/27","units":[3.0,3.0,3.0,3.0,null]},{"slot":"3.0","display":"James Harden","units":[3.0,3.0,null,null,null]},{"slot":"4.0","display":"Nic Claxton","units":[2.0,2.0,2.0,null,null]},{"slot":"5.0","display":"Scottie Barnes RME - NT 12/15/26","units":[2.0,2.0,2.0,null,null]},{"slot":"6.0","display":"Franz Wagner - NT 12/15/26","units":[2.0,2.0,2.0,null,null]},{"slot":"7.0","display":"Pascal Siakam - NT 12/15/26","units":[2.0,2.0,2.0,null,null]},{"slot":"8.0","display":"Kristaps Porzingis","units":[2.0,null,null,null,null]},{"slot":"9.0","display":"Tari Eason PRME","units":[1.0,1.0,null,null,null]},{"slot":"10.0","display":"Amen Thompson PRME","units":[1.0,null,null,null,null]},{"slot":"11.0","display":"Jaime Jaquez","units":[1.0,null,null,null,null]},{"slot":"TW","display":"Asa Newell (44 games)","units":[1.0,1.0,1.0,null,null]},{"slot":"TW","display":"Daniss Jenkins (79 games)","units":[1.0,1.0,null,null,null]},{"slot":"TW","display":"Maxime Raynaud PRME (74 games)","units":[1.0,1.0,1.0,null,null]}],"totals":[23,19,15,7,0],"gLeague":[{"display":"Noa Essengue PRME (2 games)","units":[1.0,1.0,null,null,null]},{"display":"Hugo Gonzalez (74 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Ryan Nembhard (60 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Morez Johnson Jr.","units":[1.0,1.0,1.0,1.0,null]},{"display":"Allen Graves","units":[1.0,1.0,1.0,1.0,null]}]},"F08":{"sheet":"Tom Cap","main":[{"slot":"1.0","display":"Jayson Tatum RME","units":[3.0,3.0,null,null,null]},{"slot":"2.0","display":"Donovan Mitchell","units":[3.0,3.0,null,null,null]},{"slot":"3.0","display":"Tyrese Haliburton RME - NT","units":[3.0,3.0,null,null,null]},{"slot":"4.0","display":"Jimmy Butler III","units":[3.0,null,null,null,null]},{"slot":"5.0","display":"Austin Reaves","units":[2.0,2.0,null,null,null]},{"slot":"6.0","display":"Deni Avdija","units":[2.0,2.0,null,null,null]},{"slot":"7.0","display":"Jalen Suggs","units":[1.0,null,null,null,null]},{"slot":"8.0","display":"Onyeka Okongwu","units":[1.0,null,null,null,null]},{"slot":"9.0","display":"Jaden McDaniels","units":[1.0,null,null,null,null]},{"slot":"10.0","display":"Kon Knueppel PRME","units":[1.0,1.0,1.0,null,null]},{"slot":"11.0","display":"Stephon Castle PRME","units":[1.0,1.0,null,null,null]},{"slot":"12.0","display":"Jeremiah Fears PRME","units":[1.0,1.0,1.0,null,null]},{"slot":"TW","display":"Labaron Philon Jr. PRME","units":[1.0,1.0,1.0,1.0,null]},{"slot":"TW","display":"Christian Anderson Jr.","units":[1.0,1.0,1.0,1.0,null]}],"totals":[22,16,2,0,0],"gLeague":[{"display":"David Jones Garcia (11 games)","units":[1.0,1.0,1.0,null,null]},{"display":"Rasheer Fleming (55 games)","units":[1.0,1.0,1.0,null,null]},{"display":"DaRon Holmes III PRME (25 games)","units":[1.0,1.0,null,null,null]},{"display":"Zuby Ejiofor","units":[1.0,1.0,1.0,1.0,null]},{"display":"","units":[null,null,null,null,null]}]},"F09":{"sheet":"Nate A Cap","main":[{"slot":"1.0","display":"Tyler Herro","units":[3.0,3.0,3.0,null,null]},{"slot":"3.0","display":"Ivica Zubac","units":[3.0,3.0,null,null,null]},{"slot":"2.0","display":"Joel Embiid","units":[3.0,null,null,null,null]},{"slot":"4.0","display":"Kevin Durant","units":[3.0,null,null,null,null]},{"slot":"5.0","display":"Brandon Ingram","units":[2.0,2.0,2.0,null,null]},{"slot":"6.0","display":"Desmond Bane","units":[2.0,2.0,null,null,null]},{"slot":"7.0","display":"Lamelo Ball RME","units":[2.0,2.0,null,null,null]},{"slot":"8.0","display":"Immanuel Quickley","units":[2.0,2.0,null,null,null]},{"slot":"9.0","display":"Santi Aldama","units":[1.0,null,null,null,null]},{"slot":"10.0","display":"Collin Sexton","units":[1.0,null,null,null,null]},{"slot":"11.0","display":"Darryn Peterson","units":[1.0,1.0,1.0,1.0,null]},{"slot":"TW","display":"Tre Johnson PRME (60 games)","units":[1.0,1.0,1.0,null,null]}],"totals":[23,15,6,1,0],"gLeague":[{"display":"Jase Richardson (54 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"Drake Powell (63 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"Sion James (82 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"","units":[null,null,null,null,null]},{"display":"","units":[null,null,null,null,null]}]},"F10":{"sheet":"Seth Cap","main":[{"slot":"1.0","display":"Giannis Antetokounmpo**","units":[5.0,5.0,5.0,null,null]},{"slot":"2.0","display":"Luka Doncic - RME - NT 12/15/2028","units":[3.0,3.0,3.0,3.0,null]},{"slot":"3.0","display":"Karl Anthony-Towns - RME","units":[3.0,3.0,3.0,null,null]},{"slot":"4.0","display":"Lauri Markkanen","units":[3.0,3.0,null,null,null]},{"slot":"5.0","display":"Walker Kessler","units":[2.0,2.0,2.0,2.0,null]},{"slot":"6.0","display":"Trey Murphy III","units":[1.0,1.0,null,null,null]},{"slot":"7.0","display":"Jalen Johnson PRME","units":[1.0,1.0,null,null,null]},{"slot":"8.0","display":"Cooper Flagg PRME","units":[1.0,1.0,1.0,null,null]},{"slot":"9.0","display":"Matas Buzelis PRME","units":[1.0,1.0,null,null,null]},{"slot":"10.0","display":"Kel'el Ware PRME","units":[1.0,1.0,null,null,null]},{"slot":"11.0","display":"Jarace Walker PRME","units":[1.0,null,null,null,null]},{"slot":"TW","display":"Caleb Wilson - PRME","units":[1.0,1.0,1.0,1.0,null]}],"totals":[22,21,14,5,0],"gLeague":[{"display":"Danny Wolf (57 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"Nolan Traore (56 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"Ben Saraf (44 games)","units":[1.0,1.0,1.0,1.0,null]},{"display":"","units":[null,null,null,null,null]},{"display":"","units":[null,null,null,null,null]}]}};

  function escLocal(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  }
  function norm(value) {
    return String(value || '').trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  }
  function cleanPlayerName(value) {
    let s=String(value||'').trim();
    s=s.replace(/\([^)]*(?:games?|\bg\b)[^)]*\)/ig,'');
    s=s.replace(/\*+/g,'');
    s=s.replace(/\bPRME\b/ig,'').replace(/\bRME\b/ig,'');
    s=s.replace(/\bNT\b(?:\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)?/ig,'');
    s=s.replace(/\s+-\s+/g,' ').replace(/\s{2,}/g,' ').trim();
    return s;
  }
  function routeInfo() {
    const parts=location.hash.replace(/^#/,'').split('/');
    const currentSeason=Number(typeof season!=='undefined'?season:document.getElementById('seasonSelect')?.value);
    return {fid:parts[1], valid:parts[0]==='team'&&!!TEAM_CAP_DATA[parts[1]]&&(!parts[2]||parts[2]==='overview')&&currentSeason===TEST_SEASON};
  }
  function playerIdFor(display) {
    if(!display||typeof DB==='undefined'||!DB?.Players)return '';
    const candidates=[display,cleanPlayerName(display)].map(norm).filter(Boolean);
    for(const target of candidates) {
      const exact=DB.Players.find(p=>norm(p.Player_Name)===target);
      if(exact)return exact.Player_ID||'';
    }
    return '';
  }
  function playerCell(row,isTwoWay=false) {
    if(!row.display)return '<span class="cap-empty-slot">Available G-League slot</span>';
    const pid=playerIdFor(row.display);
    const body=pid?`<span class="player-link" onclick="go('player/${pid}')">${escLocal(row.display)}</span>`:escLocal(row.display);
    return `${body}${isTwoWay?'<small class="contract-status-note">TWO WAY · CAP EXEMPT</small>':''}`;
  }
  function unitCells(units) {
    return YEARS.map((_,i)=>`<td class="contract-year-unit">${units?.[i] ?? ''}</td>`).join('');
  }
  function renderCorrectedCapSheet() {
    const route=routeInfo();
    if(!route.valid)return;
    const data=TEAM_CAP_DATA[route.fid];
    const table=document.querySelector('.team-panel .team-table');
    if(!table)return;
    const panel=table.closest('.team-panel');
    if(!panel)return;

    table.classList.add('contract-year-grid','corrected-cap-grid');
    table.innerHTML=`<thead><tr><th class="contract-player-col">Player</th>${YEARS.map(y=>`<th class="contract-year-head">${y}</th>`).join('')}</tr></thead>
      <tbody>${data.main.map(row=>{
        const tw=String(row.slot||'').trim().toUpperCase()==='TW';
        return `<tr class="contract-roster-row${tw?' two-way-cap-exempt':''}"><td class="contract-player-col">${playerCell(row,tw)}</td>${unitCells(row.units)}</tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="contract-grid-total"><th>CAP TOTAL</th>${data.totals.map(v=>`<th class="contract-year-total">${v ?? 0}</th>`).join('')}</tr></tfoot>`;

    document.querySelector('.g-league-reserves-card')?.remove();
    const section=document.createElement('section');
    section.className='card team-panel g-league-reserves-card corrected-g-league';
    section.innerHTML=`<div class="card-pad section-title"><div><div class="eyebrow">DEVELOPMENT ROSTER</div><h2>G-League</h2></div><span>5 roster slots · does not count toward cap</span></div>
      <div class="table-wrap"><table class="data-table contract-year-grid g-league-table">
      <thead><tr><th class="contract-player-col">Player</th>${YEARS.map(y=>`<th class="contract-year-head">${y}</th>`).join('')}</tr></thead>
      <tbody>${data.gLeague.map(row=>`<tr><td class="contract-player-col">${playerCell(row,false)}</td>${unitCells(row.units)}</tr>`).join('')}</tbody>
      </table></div>`;

    let stack=panel.closest('.corrected-overview-roster-stack');
    if(!stack) {
      stack=document.createElement('div');
      stack.className='corrected-overview-roster-stack';
      panel.parentNode.insertBefore(stack,panel);
      stack.appendChild(panel);
    }
    stack.appendChild(section);
  }

  function schedule() { setTimeout(renderCorrectedCapSheet,25); }
  window.addEventListener('hashchange',schedule);
  document.addEventListener('click',e=>{
    if(e.target.closest('[onclick*="go(\'team/"], [data-route="teams"]'))schedule();
  });
  document.getElementById('seasonSelect')?.addEventListener('change',schedule);
  if(location.hash.startsWith('#team/'))schedule();

  const style=document.createElement('style');
  style.textContent=`
    .corrected-overview-roster-stack{grid-column:1/-1;display:flex;flex-direction:column;gap:16px;width:100%;min-width:0}
    .corrected-overview-roster-stack>.team-panel{width:100%;box-sizing:border-box}
    .corrected-cap-grid .two-way-cap-exempt td{opacity:.82}
    .corrected-g-league{margin-top:0!important}
    .corrected-g-league .contract-year-grid{min-width:720px}
    .cap-empty-slot{opacity:.35;font-style:italic}
  `;
  document.head.appendChild(style);
})();
