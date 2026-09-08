// Team Overview contract grid: cap-sheet style yearly unit columns with team totals.
// Runs after normal team-page rendering and does not use a MutationObserver.
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

  function yearLabel(endYear) {
    const end = Number(endYear);
    return `${end - 1}-${end}`;
  }

  function extractYearFromValue(value) {
    if (value === null || value === undefined || value === '') return null;
    const s = String(value).trim();
    let m = s.match(/(20\d{2})\s*[-–/]\s*(20\d{2})/);
    if (m) return Number(m[2]);
    m = s.match(/(20\d{2})\s*[-–/]\s*(\d{2})(?!\d)/);
    if (m) return Number(`20${m[2]}`);
    if (/^20\d{2}$/.test(s)) return Number(s);
    return null;
  }

  function explicitContractYear(row) {
    const preferred = [
      'Contract_Year','Contract_Season','Contract_Year_Label','Contract_Period',
      'Salary_Year','Salary_Season','League_Year','League_Season','Year_Label'
    ];
    for (const key of preferred) {
      const y = extractYearFromValue(row?.[key]);
      if (y) return y;
    }
    for (const [key, value] of Object.entries(row || {})) {
      if (['Season_ID','Workbook_Year','End_Season','Start_Season'].includes(key)) continue;
      if (!/(year|season|period)/i.test(key)) continue;
      const y = extractYearFromValue(value);
      if (y) return y;
    }
    return null;
  }

  function contractEndYear(value, fallback) {
    const y = extractYearFromValue(value);
    if (y) return y;
    const n = Number(String(value ?? '').replace(/[^0-9]/g, ''));
    return Number.isFinite(n) && n >= 2000 ? n : Number(fallback);
  }

  function buildContractMatrix(contracts, roster, selectedSeason) {
    const currentEnd = Number(selectedSeason);
    const grouped = new Map();
    contracts.forEach(c => {
      if (!c.Player_ID) return;
      if (!grouped.has(c.Player_ID)) grouped.set(c.Player_ID, []);
      grouped.get(c.Player_ID).push(c);
    });

    const matrix = new Map();
    let maxEnd = currentEnd + 4;
    grouped.forEach(rows => {
      rows.forEach(r => {
        const explicit = explicitContractYear(r);
        if (explicit) maxEnd = Math.max(maxEnd, explicit);
        maxEnd = Math.max(maxEnd, contractEndYear(r.End_Season, currentEnd));
      });
    });
    maxEnd = Math.min(maxEnd, currentEnd + 6);
    const years = [];
    for (let end = currentEnd; end <= maxEnd; end++) years.push(yearLabel(end));

    grouped.forEach((rows, pid) => {
      const pm = new Map();
      const withYears = rows.map((row, index) => ({ row, index, year: explicitContractYear(row) }));
      const explicitRows = withYears.filter(x => x.year);
      if (explicitRows.length) {
        explicitRows.forEach(({row, year}) => {
          const units = numeric(row.Units);
          if (units !== null && year >= currentEnd && year <= maxEnd) pm.set(yearLabel(year), units);
        });
      } else if (rows.length > 1) {
        rows.forEach((row, index) => {
          const end = currentEnd + index;
          if (end > maxEnd) return;
          const units = numeric(row.Units);
          if (units !== null) pm.set(yearLabel(end), units);
        });
      } else if (rows.length === 1) {
        const row = rows[0];
        const units = numeric(row.Units);
        const endYear = contractEndYear(row.End_Season, currentEnd);
        if (units !== null) {
          pm.set(yearLabel(currentEnd), units);
          for (let end = currentEnd + 1; end <= Math.min(endYear, maxEnd); end++) pm.set(yearLabel(end), units);
        }
      }
      matrix.set(pid, pm);
    });

    const totals = new Map(years.map(y => [y, 0]));
    roster.forEach(r => {
      const pm = matrix.get(r.Player_ID);
      if (!pm) return;
      years.forEach(y => {
        const u = pm.get(y);
        if (u !== null && u !== undefined) totals.set(y, (totals.get(y) || 0) + Number(u));
      });
    });
    return { years, matrix, totals };
  }

  function formatUnits(value) {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function isOverviewRoute() {
    const parts = location.hash.replace(/^#/, '').split('/');
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

    const { years, matrix, totals } = buildContractMatrix(contracts, roster, season);
    const currentYear = years[0];
    const sortedRoster = roster.slice().sort((a, b) => {
      const sr = statusRank(a.Roster_Status) - statusRank(b.Roster_Status);
      if (sr) return sr;
      const au = matrix.get(a.Player_ID)?.get(currentYear);
      const bu = matrix.get(b.Player_ID)?.get(currentYear);
      const diff = (bu ?? -Infinity) - (au ?? -Infinity);
      if (diff) return diff;
      const an = player(a.Player_ID).Player_Name || a.Player_Name_Raw || '';
      const bn = player(b.Player_ID).Player_Name || b.Player_Name_Raw || '';
      return String(an).localeCompare(String(bn));
    });

    table.classList.add('contract-year-grid');
    table.innerHTML = `
      <thead><tr><th class="contract-player-col">Player</th>${years.map(y => `<th class="contract-year-head">${esc(y)}</th>`).join('')}</tr></thead>
      <tbody>${sortedRoster.map(r => {
        const pm = matrix.get(r.Player_ID) || new Map();
        const name = player(r.Player_ID).Player_Name || r.Player_Name_Raw || '';
        const status = String(r.Roster_Status || '').trim();
        return `<tr class="contract-roster-row status-${esc(status.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}">
          <td class="contract-player-col"><span class="player-link" onclick="go('player/${r.Player_ID}')">${esc(name)}</span>${status && status.toLowerCase() !== 'active' ? `<small class="contract-status-note">${esc(status)}</small>` : ''}</td>
          ${years.map(y => `<td class="contract-year-unit">${formatUnits(pm.get(y))}</td>`).join('')}
        </tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="contract-grid-total"><th>TEAM TOTAL</th>${years.map(y => `<th class="contract-year-total">${formatUnits(totals.get(y) || 0)}</th>`).join('')}</tr></tfoot>`;
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[onclick*="go(\'team/"], [data-route="teams"]')) setTimeout(renderContractGrid, 0);
  });
  const seasonSelect = document.getElementById('seasonSelect');
  if (seasonSelect) seasonSelect.addEventListener('change', () => setTimeout(renderContractGrid, 0));
  if (location.hash.startsWith('#team/')) setTimeout(renderContractGrid, 0);

  const style = document.createElement('style');
  style.textContent = `
    .team-panel{overflow-x:auto}
    .contract-year-grid{width:100%;min-width:720px;table-layout:fixed}
    .contract-year-grid .contract-player-col{width:210px;max-width:210px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:12px}
    .contract-year-grid th.contract-year-head,
    .contract-year-grid td.contract-year-unit,
    .contract-year-grid th.contract-year-total{width:94px;min-width:94px;white-space:nowrap;text-align:center !important;vertical-align:middle}
    .contract-year-grid .contract-status-note{display:inline;margin-left:7px;font-size:10px;opacity:.65;text-transform:uppercase;letter-spacing:.03em}
    .contract-year-grid tfoot .contract-grid-total th{font-weight:800;border-top:2px solid currentColor;white-space:nowrap}
    .contract-year-grid tfoot .contract-grid-total th:first-child{text-align:left}
    @media(max-width:760px){
      .contract-year-grid{min-width:680px}
      .contract-year-grid .contract-player-col{width:175px;max-width:175px}
      .contract-year-grid th.contract-year-head,.contract-year-grid td.contract-year-unit,.contract-year-grid th.contract-year-total{width:88px;min-width:88px}
    }
  `;
  document.head.appendChild(style);
})();