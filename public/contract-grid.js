// Team Overview contract grid: show contract units by league year with team totals.
// Runs after the normal team page render and does not use a MutationObserver.
(function () {
  const YEAR_KEY_RE = /^\s*(20\d{2})\s*[-–/]\s*(20\d{2})\s*$/;

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

  function normalizeYearLabel(value) {
    if (value === null || value === undefined || value === '') return '';
    const s = String(value).trim();
    let m = s.match(/(20\d{2})\s*[-–/]\s*(20\d{2})/);
    if (m) return `${m[1]}-${m[2]}`;
    m = s.match(/(20\d{2})\s*[-–/]\s*(\d{2})(?!\d)/);
    if (m) return `${m[1]}-20${m[2]}`;
    if (/^20\d{2}$/.test(s)) {
      const end = Number(s);
      return `${end - 1}-${end}`;
    }
    return '';
  }

  function yearStart(label) {
    const m = String(label || '').match(/^(20\d{2})-/);
    return m ? Number(m[1]) : 9999;
  }

  function embeddedYearKeys(contracts) {
    const out = new Map();
    contracts.forEach(c => Object.keys(c || {}).forEach(k => {
      const m = String(k).match(YEAR_KEY_RE);
      if (m) out.set(k, `${m[1]}-${m[2]}`);
    }));
    return out;
  }

  function rowYearField(contracts) {
    const preferred = [
      'Contract_Year', 'Contract_Season', 'Contract_Year_Label',
      'Salary_Year', 'Salary_Season', 'League_Year', 'League_Season',
      'Contract_Period', 'Year_Label', 'Year', 'Season'
    ];
    for (const key of preferred) {
      if (contracts.some(c => normalizeYearLabel(c?.[key]))) return key;
    }

    const excluded = new Set(['Season_ID', 'Workbook_Year', 'End_Season', 'Start_Season']);
    const keys = [...new Set(contracts.flatMap(c => Object.keys(c || {})))];
    return keys.find(key => {
      if (excluded.has(key) || !/(year|season|period)/i.test(key)) return false;
      return contracts.some(c => normalizeYearLabel(c?.[key]));
    }) || '';
  }

  function buildContractMatrix(contracts, selectedSeason) {
    const embedded = embeddedYearKeys(contracts);
    const matrix = new Map();
    const totals = new Map();
    let years = [];

    function add(pid, year, amount) {
      if (!pid || !year || amount === null) return;
      if (!matrix.has(pid)) matrix.set(pid, new Map());
      const pm = matrix.get(pid);
      pm.set(year, (pm.get(year) || 0) + amount);
      totals.set(year, (totals.get(year) || 0) + amount);
    }

    if (embedded.size) {
      years = [...new Set(embedded.values())].sort((a, b) => yearStart(a) - yearStart(b));
      contracts.forEach(c => {
        embedded.forEach((year, key) => add(c.Player_ID, year, numeric(c[key])));
      });
    } else {
      const yearField = rowYearField(contracts);
      if (yearField) {
        contracts.forEach(c => {
          const year = normalizeYearLabel(c[yearField]);
          add(c.Player_ID, year, numeric(c.Units));
        });
        years = [...totals.keys()].sort((a, b) => yearStart(a) - yearStart(b));
      }
    }

    // Safe fallback for older seasons whose normalized contract records contain only
    // a current-season Units value. This still keeps the Overview functional.
    if (!years.length) {
      const current = `${Number(selectedSeason) - 1}-${Number(selectedSeason)}`;
      years = [current];
      contracts.forEach(c => add(c.Player_ID, current, numeric(c.Units)));
    }

    const currentStart = Number(selectedSeason) - 1;
    const futureYears = years.filter(y => yearStart(y) >= currentStart);
    if (futureYears.length) years = futureYears;

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
        <th>Player</th>
        <th>Status</th>
        ${years.map(y => `<th class="num contract-year-head">${esc(y)}</th>`).join('')}
      </tr></thead>
      <tbody>${sortedRoster.map(r => {
        const pm = matrix.get(r.Player_ID) || new Map();
        const name = player(r.Player_ID).Player_Name || r.Player_Name_Raw || '';
        return `<tr>
          <td><span class="player-link" onclick="go('player/${r.Player_ID}')">${esc(name)}</span></td>
          <td><span class="roster-status ${String(r.Roster_Status || '').toLowerCase()}">${esc(r.Roster_Status || '')}</span></td>
          ${years.map(y => `<td class="num contract-year-unit">${formatUnits(pm.has(y) ? pm.get(y) : null)}</td>`).join('')}
        </tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="contract-grid-total">
        <th colspan="2">TEAM TOTAL</th>
        ${years.map(y => `<th class="num">${formatUnits(totals.get(y) || 0)}</th>`).join('')}
      </tr></tfoot>`;
  }

  // Run only after normal route rendering. No observer: avoids the crash loop that
  // occurred with the earlier roster-sort implementation.
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
    .contract-year-grid .contract-year-head,.contract-year-grid .contract-year-unit{white-space:nowrap;text-align:right}
    .contract-year-grid tfoot .contract-grid-total th{font-weight:800;border-top:2px solid currentColor}
    .contract-year-grid tfoot .contract-grid-total th:first-child{text-align:left;letter-spacing:.04em}
  `;
  document.head.appendChild(style);
})();
