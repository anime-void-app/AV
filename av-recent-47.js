/* ANIME VOID 47.0 — compact recent activity preview.
   Uses only saved verified player records or manual mark summaries.
   Never mutates viewing history, account data or achievements. */
(()=>{'use strict';
  const hosts=[...document.querySelectorAll('[data-av-recent-preview]')];
  if(!hosts.length)return;
  const safe=window.AVSafe, ledger=window.AVWatchLedger, state=window.AVState;
  const ru=()=>localStorage.getItem('animeVoidLanguage')!=='en';
  const t=(a,b)=>ru()?a:b;
  const get=(key,def)=>{try{return safe?.read?.(key,def)??def}catch{return def}};
  const idOf=x=>state?.canonicalId?.(x)||null;
  const el=(tag,className,content)=>{
    const n=document.createElement(tag);if(className)n.className=className;
    if(content!==undefined)n.textContent=String(content);
    return n;
  };
  const poster=x=>{
    if(typeof x!=='string'||!x)return 'poster-unavailable.svg';
    if(x==='poster-unavailable.svg')return x;
    try{const u=new URL(x,location.href);if(u.protocol==='https:'||(u.origin===location.origin&&u.protocol==='http:'))return u.href}catch{}
    return 'poster-unavailable.svg';
  };
  function catalog(){
    const items=get('animeVoidCatalog',[]);
    const map=new Map();
    if(Array.isArray(items))for(const x of items){const id=idOf(x?.id);if(id&&!map.has(id))map.set(id,x)}
    return map;
  }
  const title=(x,id)=>{
    let name='';
    try{name=window.AVTitles?.display?.(x,ru()?'ru':'en')||''}catch{}
    if(!name)name=x?.title||x?.title_english||x?.title_romaji||'';
    if(!name)name=id?t('Аниме №','Anime #')+id.replace(/^anilist-/,''):t('Неизвестное аниме','Unknown anime');
    return String(name);
  };
  function records(meta){
    const result=[];
    try {
      const raw=localStorage.getItem(ledger?.KEY||'animeVoidMeasuredV1');
      if(raw&&ledger){
        const archive=ledger.validate(JSON.parse(raw));
        const entries=ledger.presentation(archive).entries;
        for(const x of entries){
          if(ledger.count(x.coverage)<=0)continue;
          const id=idOf(x.titleId);
          const match=id?meta.get(id):null;
          const label=x.kind==='movie'?t('Фильм','Movie'):t('Сезон ','Season ')+x.season+' · '+t('серия ','episode ')+x.episode;
          const coverage=(ledger.count(x.coverage)/10).toFixed(1)+'%';
          const link=id?'watch.html?id='+encodeURIComponent(id)+'&episode='+encodeURIComponent(x.episode):'history.html';
          result.push({name:x.title||title(match,id),label:label+' · '+coverage+' '+t('подтверждено','verified'),poster:poster(match?.image),href:link,kind:'measured',stamp:x.updatedAt});
          if(result.length>=3)break;
        }
      }
    }catch(error){console.warn('ANIME VOID: recent measured history unavailable',error)}
    if(result.length)return result;
    // Manual marks have no reliable timestamps. Never present them as dated recent views.
    try {
      const entries=state?.metrics?.()?.titles||[];
      for(const x of entries.slice().sort((a,b)=>(b.episodes?.length||0)-(a.episodes?.length||0))){
        if(!Array.isArray(x.episodes)||!x.episodes.length)continue;
        const id=idOf(x.item?.id);
        if(!id)continue;
        const item=meta.get(id)||x.item;
        result.push({name:title(item,id),label:t('Отмечено вручную: ','Manually marked: ')+x.episodes.length+t(' сер.',' ep.'),poster:poster(item?.image),href:'watch.html?id='+encodeURIComponent(id)+'&episode=1',kind:'manual'});
        if(result.length>=3)break;
      }
    }catch(error){console.warn('ANIME VOID: recent manual marks unavailable',error)}
    return result;
  }
  function render(){
    const meta=catalog(),items=records(meta);
    for(const host of hosts){
      const heading=el('div','av-47-recent-head');
      const h=el('h2','',t('Продолжай смотреть','Continue watching'));
      heading.append(h);
      const all=el('a','',t('Вся история','Full history'));all.href='history.html';heading.append(all);
      const list=el('div','av-47-recent-list');
      if(!items.length){
        host.hidden=true;
        host.replaceChildren();
        continue;
      }
      host.hidden=false;
      if(items[0].kind==='manual')h.textContent=t('Мои просмотренные серии','My marked episodes');
      for(const item of items){
        const card=el('a','av-47-recent-item');card.href=item.href;
        const img=el('img','');img.src=item.poster;img.alt='';img.loading='lazy';
        img.addEventListener('error',()=>{if(!img.src.endsWith('poster-unavailable.svg'))img.src='poster-unavailable.svg'},{once:true});
        const info=el('span','av-47-recent-info');
        info.append(el('strong','',item.name),el('small','',item.label));
        const arrow=el('span','av-47-recent-arrow','↗');arrow.setAttribute('aria-hidden','true');
        card.append(img,info,arrow);
        list.append(card);
      }
      host.replaceChildren(heading,list);
    }
  }
  let task=false;
  function refresh(){
    if(task)return;task=true;
    setTimeout(()=>{task=false;try{render()}catch(e){console.warn('ANIME VOID: recent history UI unavailable',e)}},120);
  }
  addEventListener('storage',ev=>{
    if(ev.storageArea!==localStorage)return;
    if(ev.key===null||/^(?:animeVoid(?:MeasuredV1|Catalog|Language|LastWatch)|watched_)/.test(ev.key))refresh();
  });
  addEventListener('av:measured',refresh);
  addEventListener('av:cloud-restored',refresh);
  addEventListener('pageshow',refresh);
  addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  render();
})();