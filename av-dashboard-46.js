/* ANIME VOID 63.0 — compact home/profile navigation.
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
    const measurementIds=new Set();
    try {
      const data=window.AVSafe?.read?.('animeVoidMeasuredV1',null);
      // Use the exact same read-only, de-duplicated presentation used by
      // history.html and the recent player preview. Multiple durations of
      // one episode must not inflate the compact profile counter.
      const episodeRecords=data
        ?(window.AVWatchLedger?.presentation?.(data)?.entries||Object.values(data.entries||{}))
        :[];
      for(const entry of episodeRecords){
        if(typeof entry?.coverage!=='string'||!/[1-9a-f]/i.test(entry.coverage))continue;
        const episodeKey=[entry.titleId,entry.season,entry.episode].join(':');
        measurementIds.add(episodeKey);
        const id=canonical(entry.titleId)||entry.titleId;
        if(typeof id==='string'&&id)titleIds.add(id);
      }
    }catch{}
    const measured=measurementIds.size;
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
    for(const el of document.querySelectorAll('#av46HomeLinks [data-ru][data-en],.av-46-profile-journey [data-ru][data-en]')){
      el.textContent=isRussian()?el.dataset.ru:el.dataset.en;
    }
    const n=snapshot(),titles=n.titles;
    const ruPlural=(number,one,few,many)=>{
      const last=number%10,lastTwo=number%100;
      return number+' '+((lastTwo>=11&&lastTwo<=14)?many:last===1?one:last>=2&&last<=4?few:many);
    };
    const enPlural=(number,one,many)=>number+' '+(number===1?one:many);
    const ruTitles=count=>ruPlural(count,'тайтл','тайтла','тайтлов');
    const enTitles=count=>enPlural(count,'title','titles');
    setText('av46HomeHistoryCount',titles?tr(ruTitles(titles)+' в истории',enTitles(titles)+' in history'):tr('Просмотры и отметки','Views and marks'));
    setText('av46HomeFavoritesCount',n.favorites?tr(ruPlural(n.favorites,'любимый тайтл','любимых тайтла','любимых тайтлов'),enPlural(n.favorites,'favorite','favorites')):tr('Избранное и статусы','Favorites and statuses'));
    setText('av46ProfileHistoryCount',titles?tr(ruTitles(titles)+' · '+ruPlural(n.measured,'запись плеера','записи плеера','записей плеера'),enTitles(titles)+' · '+enPlural(n.measured,'player entry','player entries')):tr('Фактический просмотр и отметки','Player records and marks'));
    setText('av46ProfileWatchingCount',n.watching?tr(ruTitles(n.watching)+' со статусом «Смотрю»',enTitles(n.watching)+' marked watching'):tr('Тайтлы со статусом «Смотрю»','Titles marked as watching'));
    setText('av46ProfileFavoriteCount',n.favorites?tr(ruPlural(n.favorites,'любимый тайтл','любимых тайтла','любимых тайтлов'),enPlural(n.favorites,'favorite title','favorite titles')):tr('Любимые тайтлы','Favorite titles'));
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
