// Team Overview contract grid: show contract units by league year with team totals.
// Runs after the normal team page render and does not use a MutationObserver.
(function () {
  function statusRank(value) {
    const s = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
    if (s === 'active') return 0;
    if (s === 'tw' || s === 'two way' || s.includes('two way')) return 1;
    return 2;
  }

  function numeric(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function leagueYearLabel(endYear) {
    const end = Number(endYear);
    return `${end - 1}-${end}`;
  }

  function contractEndYear(value, selectedSeason) {
    if (value === null || value === undefined || value === '') return Number(selectedSeason);
    const s = String(value).trim();

    let m = s.match(/(20\d{2})\s*[-–/]\s*(20\d{2})/);
    if (m) return Number(m[2]);

    m = s.match(/(20\d{2})\s*[-–/]\s*(\d{2})(?!\d)/);
    if (m) return Number(`20${m[2]}`);

    m = s.match(/20\d{2}/g);
    if (m && m.length) return Number(m[m.length - 1]);

    const n = Number(String(value).replace(/[^0-9]/g, ''));
    return Number.isFinite(n) && n >= 2000 ? n : Number(selectedSeason);
  }

  function buildContractMatrix(contracts, selectedSeason) {
    const matrix = new Map();
    const totals = new Map();
    const currentEndYear = Number(selectedSeason);

    let maxEndYear = currentEndYear;
    contracts.forEach(c => {
      maxEndYear = Math.max(maxEndYear, contractEndYear(c.End_Season, currentEndYear));
    });

    const years = [];
    for (let end = currentEndYear; end <= maxEndYear; end++) {
      years.push(leagueYearLabel(end));
      totals.set(leagueYearLabel(end), 0);
    }

    contracts.forEach(c => {
      if (!c.Player_ID) return;
      const units = numeric(c.Units);
      if (units === null) return;

      const endYear = Math.max(currentEndYear, contractEndYear(c.End_Season, currentEndYear));
      const pm = new Map();

      for (let end = currentEndYear; end <= endYear; end++) {
        const label = leagueYearLabel(end);
        pm.set(label, units);
        totals.set(label, (totals.get(label) || 0) + units);
      }

      matrix.set(c.Player_ID, pm);
    });

    return { years, matrix, totals };
  }

  function formatUnits(value) {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function isOverviewRoute() {
    const hash = location.hash.replace(/^#/, '');
    const parts = hash.split('/');
    return parts[0] === 'team' && !!parts[1] && (!parts[2] || parts[2] === 'overview');
  }

  function renderContractGrid() {
    if (!isOverviewRoute() || typeof DB === 'undefined' || !DB) return;

    const parts = location.hash.replace(/^#/, '').split('/');
    const fid = parts[1];
    const sid = typeof seasonId === 'function' ? seasonId(season) : `S${season}`;
    const roster = (DB.Rosters || []).filter(r => r.Franchise_ID === fid && r.Season_ID === sid);
    const contracts = (DB.Contracts || []).filter(c => c.Franchise_ID === fid && c.Season_ID === sid);
    if (!roster.length) return;

    const table = document.querySelector('.team-panel .team-table');
    if (!table) return;

    const { years, matrix, totals } = buildContractMatrix(contracts, season);
    const currentYear = years[0];

    const sortedRoster = roster.slice().sort((a, b) => {
      const sr = statusRank(a.Roster_Status) - statusRank(b.Roster_Status);
      if (sr) return sr;

      const au = matrix.get(a.Player_ID)?.get(currentYear);
      const bu = matrix.get(b.Player_ID)?.get(currentYear);
      const unitDiff = (bu ?? -Infinity) - (au ?? -Infinity);
      if (unitDiff) return unitDiff;

      const an = player(a.Player_ID).Player_Name || a.Player_Name_Raw || '';
      const bn = player(b.Player_ID).Player_Name || b.Player_Name_Raw || '';
      return String(an).localeCompare(String(bn));
    });

    table.classList.add('contract-year-grid');
    table.innerHTML = `
      <thead><tr>
        <th class="contract-player-col">Player</th>
        <th class="contract-status-col">Status</th>
        ${years.map(y => `<th class="num contract-year-head">${esc(y)}</th>`).join('')}
      </tr></thead>
      <tbody>${sortedRoster.map(r => {
        const pm = matrix.get(r.Player_ID) || new Map();
        const name = player(r.Player_ID).Player_Name || r.Player_Name_Raw || '';
        return `<tr>
          <td class="contract-player-col"><span class="player-link" onclick="go('player/${r.Player_ID}')">${esc(name)}</span></td>
          <td class="contract-status-col"><span class="roster-status ${String(r.Roster_Status || '').toLowerCase()}">${esc(r.Roster_Status || '')}</span></td>
          ${years.map(y => `<td class="num contract-year-unit">${formatUnits(pm.has(y) ? pm.get(y) : null)}</td>`).join('')}
        </tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="contract-grid-total">
        <th colspan="2">TEAM TOTAL</th>
        ${years.map(y => `<th class="num">${formatUnits(totals.get(y) || 0)}</th>`).join('')}
      </tr></tfoot>`;
  }

  // Run after normal route rendering. No observer: avoids the crash loop from the
  // earlier roster-sort implementation.
  document.addEventListener('click', e => {
    if (e.target.closest('[onclick*="go(\'team/"], [data-route="teams"]')) {
      setTimeout(renderContractGrid, 0);
    }
  });

  const seasonSelect = document.getElementById('seasonSelect');
  if (seasonSelect) seasonSelect.addEventListener('change', () => setTimeout(renderContractGrid, 0));

  if (location.hash.startsWith('#team/')) setTimeout(renderContractGrid, 0);

  const style = document.createElement('style');
  style.textContent = `
    .team-panel{overflow-x:auto}
    .contract-year-grid{width:max-content;min-width:100%;table-layout:auto}
    .contract-year-grid .contract-player-col{width:1%;max-width:220px;white-space:nowrap;padding-right:16px}
    .contract-year-grid .contract-status-col{width:1%;white-space:nowrap;padding-right:14px}
    .contract-year-grid .contract-year-head,.contract-year-grid .contract-year-unit{min-width:92px;white-space:nowrap;text-align:right}
    .contract-year-grid tfoot .contract-grid-total th{font-weight:800;border-top:2px solid currentColor;white-space:nowrap}
    .contract-year-grid tfoot .contract-grid-total th:first-child{text-align:left;letter-spacing:.04em}
    @media(max-width:760px){
      .contract-year-grid .contract-player-col{max-width:180px}
      .contract-year-grid .contract-year-head,.contract-year-grid .contract-year-unit{min-width:84px}
    }
  `;
  document.head.appendChild(style);
})();