// Keep the all-time regular-season record directly below the six team navigation tabs.
(function () {
  function positionAllTimeRecord() {
    const parts = location.hash.replace(/^#/, '').split('/');
    if (parts[0] !== 'team' || parts[2] !== 'history') return;

    const tabs = document.querySelector('#app .team-tabs');
    const record = document.querySelector('#app .alltime-regular-record');
    if (!tabs || !record) return;

    if (tabs.nextElementSibling !== record) {
      tabs.insertAdjacentElement('afterend', record);
    }
  }

  // espn-history-ui.js loads the record asynchronously, so watch the app until it appears.
  const observer = new MutationObserver(positionAllTimeRecord);
  const app = document.getElementById('app');
  if (app) observer.observe(app, { childList: true, subtree: true });

  window.addEventListener('hashchange', () => setTimeout(positionAllTimeRecord, 50));
  document.addEventListener('click', () => setTimeout(positionAllTimeRecord, 75));
  setTimeout(positionAllTimeRecord, 100);
})();
