// Hide internal franchise IDs (F01-F10) from all user-facing team views.
(function () {
  function removeInternalFranchiseIds(root = document) {
    root.querySelectorAll?.('.team-grid .team-card > .eyebrow').forEach(el => {
      if (/^F\d{2}$/.test(el.textContent.trim())) el.remove();
    });

    // Individual team landing/header: "F01 · DYNASTY NBA FRANCHISE"
    root.querySelectorAll?.('.team-command .eyebrow').forEach(el => {
      const text = el.textContent.trim();
      if (/^F\d{2}\s*·\s*DYNASTY NBA FRANCHISE$/i.test(text)) {
        el.textContent = 'DYNASTY NBA FRANCHISE';
      }
    });
  }

  removeInternalFranchiseIds();

  const observer = new MutationObserver(() => removeInternalFranchiseIds());
  observer.observe(document.getElementById('app') || document.body, {
    childList: true,
    subtree: true
  });
})();
