// Beta UI cleanup for the Players index only.
(function(){
  function cleanPlayersList(){
    const table=document.querySelector('#playerTable');
    if(!table) return;

    // Remove ESPN injury-status sublines such as "Out" from player names.
    table.querySelectorAll('tbody td:first-child .subline').forEach(el=>el.remove());

    // Remove the redundant Status column (Active / Free Agent, etc.).
    const headers=[...table.querySelectorAll('thead th')];
    const statusIndex=headers.findIndex(th=>th.textContent.trim().toLowerCase()==='status');
    if(statusIndex>=0){
      table.querySelectorAll('tr').forEach(row=>{
        const cell=row.children[statusIndex];
        if(cell) cell.remove();
      });
    }
  }

  const observer=new MutationObserver(cleanPlayersList);
  const start=()=>{
    const app=document.querySelector('#app');
    if(app) observer.observe(app,{childList:true,subtree:true});
    cleanPlayersList();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
