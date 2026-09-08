// Rookie draft board layout: each 10-pick round reads 1-5 down the left and 6-10 down the right.
// This applies the same pattern to Round 2 (11-15 left, 16-20 right) and every archived season.
(function () {
  const originalDrafts = window.drafts;
  if (typeof originalDrafts !== 'function') return;

  window.drafts = function draftsVerticalColumns() {
    const all = DB['Rookie Draft Picks'] || [];
    const picks = all.filter(x => x.Season_ID === seasonId(season)).slice().sort((a,b) => Number(a.Overall_Pick) - Number(b.Overall_Pick));
    const rounds = [...new Set(picks.map(x => Number(x.Round)).filter(Boolean))];
    const traded = picks.filter(x => x.Original_Owner_ID && x.Current_Owner_ID && x.Original_Owner_ID !== x.Current_Owner_ID).length;
    const years = seasonYears();
    const nav = `<div class="archive-season-nav"><span>Draft archive</span>${years.map(y => `<button class="${y===season?'active':''}" onclick="setSeason(${y});render()">${y}</button>`).join('')}</div>`;

    const pickCard = x => {
      const changed = x.Original_Owner_ID && x.Current_Owner_ID && x.Original_Owner_ID !== x.Current_Owner_ID;
      const currentF = x.Current_Franchise_ID || x.Franchise_ID || '';
      const originalF = x.Original_Franchise_ID || '';
      return `<div class="draft-pick"><div class="pick-no">${esc(x.Overall_Pick)}</div><div class="pick-main"><small>Pick ${esc(x.Round)}.${String(x.Slot||'').padStart(2,'0')}</small><b>${playerLink(x.Selection,'draft-player-link')}</b><span>${franchiseLink(currentF,x.Current_Owner||ownerName(x.Current_Owner_ID)||x.Team_Raw||'')}</span></div>${changed?`<div class="pick-traded">FROM<br>${franchiseLink(originalF,x.Original_Owner||ownerName(x.Original_Owner_ID))}</div>`:''}</div>`;
    };

    const roundBoard = r => {
      const rp = picks.filter(x => Number(x.Round) === r).sort((a,b) => Number(a.Overall_Pick) - Number(b.Overall_Pick));
      const split = Math.ceil(rp.length / 2);
      const left = rp.slice(0, split);
      const right = rp.slice(split);
      const rows = Array.from({length: Math.max(left.length, right.length)}, (_,i) =>
        `<div class="draft-board-row"><div class="draft-board-cell">${left[i] ? pickCard(left[i]) : ''}</div><div class="draft-board-cell">${right[i] ? pickCard(right[i]) : ''}</div></div>`
      ).join('');
      return `<section class="card draft-round"><div class="card-pad section-title"><h2>Round ${r}</h2><span>${rp.length} picks</span></div><div class="draft-board draft-board-vertical">${rows}</div></section>`;
    };

    layout('Rookie Drafts','Complete custom rookie-draft archive. Selections link directly to player profiles when a normalized player match exists; team ownership links to franchise headquarters.',`${nav}<div class="stat-strip"><div><b>${picks.length}</b><span>${season} selections</span></div><div><b>${rounds.length}</b><span>Rounds</span></div><div><b>${traded}</b><span>Picks changed hands</span></div><div><b>${all.length}</b><span>All-time selections</span></div></div>${rounds.map(roundBoard).join('')||'<div class="empty">No rookie draft data for this season.</div>'}`);
  };

  const style = document.createElement('style');
  style.textContent = `.draft-board-vertical{display:block}.draft-board-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.draft-board-cell{min-width:0}.draft-board-cell .draft-pick{height:100%}@media(max-width:760px){.draft-board-row{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  if (typeof route !== 'undefined' && route === 'drafts' && typeof render === 'function') render();
})();
