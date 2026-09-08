// Sort the roster shown on each team Overview page without observing DOM mutations.
// Order: Active, then Two Way / TW, then any other status.
// Within each status group: Units highest to lowest, then player name.
(function () {
  function statusRank(value) {
    const s = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
    if (s === 'active') return 0;
    if (s === 'tw' || s === 'two way' || s === 'two-way' || s.includes('two way')) return 1;
    return 2;
  }

  function unitValue(row) {
    const raw = row.cells && row.cells[2] ? row.cells[2].textContent : '';
    const n = Number(String(raw || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : -Infinity;
  }

  function sortOverviewRoster() {
    document.querySelectorAll('.team-panel .team-table tbody').forEach(tbody => {
      const rows = Array.from(tbody.rows).filter(row => row.cells.length >= 3 && !row.cells[0].hasAttribute('colspan'));
      if (rows.length < 2) return;

      rows.sort((a, b) => {
        const rankDiff = statusRank(a.cells[1] && a.cells[1].textContent) - statusRank(b.cells[1] && b.cells[1].textContent);
        if (rankDiff) return rankDiff;

        const unitDiff = unitValue(b) - unitValue(a);
        if (unitDiff) return unitDiff;

        return String(a.cells[0] && a.cells[0].textContent || '').trim()
          .localeCompare(String(b.cells[0] && b.cells[0].textContent || '').trim());
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  }

  // app.js renders pages through layout(). Hook that once so sorting happens
  // immediately after a team Overview is rendered, with no MutationObserver loop.
  if (typeof window.layout === 'function') {
    const originalLayout = window.layout;
    window.layout = function (...args) {
      const result = originalLayout.apply(this, args);
      sortOverviewRoster();
      return result;
    };
  }
})();
