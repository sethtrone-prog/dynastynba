// Hide internal franchise IDs (F01-F10) from the user-facing Teams page.
(function () {
  function removeInternalFranchiseIds(root = document) {
    root.querySelectorAll?.('.team-grid .team-card > .eyebrow').forEach(el => {
      if (/^F\d{2}$/.test(el.textContent.trim())) el.remove();
    });
  }

  removeInternalFranchiseIds();

  const observer = new MutationObserver(() => removeInternalFranchiseIds());
  observer.observe(document.getElementById('app') || document.body, {
    childList: true,
    subtree: true
  });
})();
