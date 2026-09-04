// German update log. It is based on the same English update log and is
// translated automatically once the German language is selected.
(function(){
  window.UPDATES_DE = [];
  window.UPDATES_DE_READY = false;
  function finish(){ window.UPDATES_DE_READY = true; window.dispatchEvent(new Event('updates-de-ready')); }
  function run(){
    const src = Array.isArray(window.UPDATES_EN) ? window.UPDATES_EN : [];
    if(!window.AutoTranslator || typeof window.AutoTranslator.translateText !== 'function') { finish(); return; }
    Promise.all(src.map(async u => {
      let title=u.title, info=u.info;
      try { title = await window.AutoTranslator.translateText(u.title,'en','de'); } catch(_) {}
      try { info = await window.AutoTranslator.translateText(u.info,'en','de'); } catch(_) {}
      return {title, date:u.date, time:u.time, info};
    })).then(items=>{ window.UPDATES_DE=items; finish(); }).catch(()=>finish());
  }
  if(Array.isArray(window.UPDATES_EN)) run();
  else {
    const s=document.createElement('script'); s.src='updates-en.js?v='+Date.now(); s.onload=run; s.onerror=finish; document.head.appendChild(s);
  }
})();
