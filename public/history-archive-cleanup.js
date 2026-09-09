// Remove the ESPN season-summary card from the league History view.
(function(){
  function removeArchiveCard(){
    const base=location.hash.replace(/^#/,'').split('/')[0]||'home';
    if(base!=='history')return;
    document.querySelectorAll('#app .espn-season-summary').forEach(el=>el.remove());
  }
  const app=document.getElementById('app');
  if(app)new MutationObserver(removeArchiveCard).observe(app,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>setTimeout(removeArchiveCard,40));
  document.addEventListener('click',()=>setTimeout(removeArchiveCard,60));
  setTimeout(removeArchiveCard,80);
})();
