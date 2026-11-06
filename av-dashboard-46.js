/* ANIME VOID 46.0 — compact home/profile navigation.
   Data is read-only; values are never written, awarded or used as entitlements. */
(()=>{'use strict';
  const home=document.getElementById('av46HomeLinks');
  const profile=document.querySelector('.av-46-profile-journey');
  if(!home&&!profile)return;
  const isRussian=()=>localStorage.getItem('animeVoidLanguage')!=='en';
  const tr=(ru,en)=>isRussian()?ru:en;
  const $=id=>document.getElementById(id);
  const canonical=x=>window.AVState?.canonicalId?.(x)||null;
  function snapshot(){
    const view=window.AVState?.savedView?.();
    const metrics=window.AVState?.metrics?.();
    const titleIds=new Set(Array.isArray(metrics?.titles)?metrics.titles.map(x=>canonical(x.item?.id)).filter(Boolean):[]);
    let measured=0;
    try {
      const data=window.AVSafe?.read?.('animeVoidMeasuredV1',null);
      for(const entry of Object.values(data?.entries||{})){
        if(typeof entry?.coverage!=='string'||!/[1-9a-f]/i.test(entry.coverage))continue;
        measured++;
        const id=canonical(entry.titleId)||entry.titleId;
        if(typeof id==='string'&&id)titleIds.add(id);
      }
    }catch{}
    return {
      titles:titleIds.size,
      measured,
      favorites:view?.favorites?.size||0,
      watching:[...(view?.statuses?.values?.()||[])].filter(value=>value==='watching').length
    };
  }
  function setText(id,value){const el=$(id);if(el)el.textContent=value;}
  function update(){
    if(!home?.isConnected&&!profile?.isConnected)return;
    const root=home||profile;
    for(const el of document.querySelectorAll('#av46HomeLinks [data-ru][data-en],.av-46-profile-journey [data-ru][data-en]')){
      el.textContent=isRussian()?el.dataset.ru:el.dataset.en;
    }
    const n=snapshot(),titles=n.titles;
    setText('av46HomeHistoryCount',titles?tr(titles+' тайтлов в истории',titles+' titles in history'):tr('Просмотры и отметки','Views and marks'));
    setText('av46HomeFavoritesCount',n.favorites?tr(n.favorites+' в избранном',n.favorites+' favorites'):tr('Избранное и статусы','Favorites and statuses'));
    setText('av46ProfileHistoryCount',titles?tr(titles+' тайтлов · '+n.measured+' замеров',titles+' titles · '+n.measured+' measurements'):tr('Фактический просмотр и отметки','Player records and marks'));
    setText('av46ProfileWatchingCount',n.watching?tr(n.watching+' тайтлов со статусом «Смотрю»',n.watching+' titles marked watching'):tr('Тайтлы со статусом «Смотрю»','Titles marked as watching'));
    setText('av46ProfileFavoriteCount',n.favorites?tr(n.favorites+' любимых тайтлов',n.favorites+' favorite titles'):tr('Любимые тайтлы','Favorite titles'));
  }
  let pending=false;
  function schedule(){
    if(pending)return;
    pending=true;
    setTimeout(()=>{pending=false;try{update();}catch(error){console.warn('ANIME VOID: quick links unavailable',error)}},90);
  }
  addEventListener('storage',event=>{
    if(event.storageArea!==localStorage)return;
    if(event.key===null||/^(?:animeVoid(?:MeasuredV1|Favorites|Statuses|Catalog|Language|LastWatch)|watched_)/.test(event.key))schedule();
  });
  addEventListener('av:measured',schedule);
  addEventListener('av:cloud-restored',schedule);
  addEventListener('pageshow',schedule);
  addEventListener('focus',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  document.addEventListener('click',event=>{if(event.target?.closest?.('#ruBtn,#enBtn'))schedule();});
  if(window.MutationObserver){
    new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  schedule();
})();
