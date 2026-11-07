/* ANIME VOID 48.0 — read-only recent viewing preview.
   Player-confirmed episodes and manually marked episodes have separate views.
   This UI never writes or infers viewing history, rewards or account state. */
(() => {
  'use strict';
  const hosts=[...document.querySelectorAll('[data-av-recent-preview]')];
  if(!hosts.length)return;
  const safe=window.AVSafe, ledger=window.AVWatchLedger, state=window.AVState;
  const ru=()=>localStorage.getItem('animeVoidLanguage')!=='en';
  const tr=(a,b)=>ru()?a:b;
  const read=(key,fallback)=>{try{return safe?.read?.(key,fallback)??fallback}catch{return fallback}};
  const idOf=value=>state?.canonicalId?.(value)||null;
  const el=(tag,className,content)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(content!==undefined)node.textContent=String(content);
    return node;
  };
  function safePoster(value){
    if(typeof value!=='string'||!value)return 'poster-unavailable.svg';
    if(value==='poster-unavailable.svg')return value;
    try{
      const url=new URL(value,location.href);
      if(url.protocol==='https:'||(url.origin===location.origin&&url.protocol==='http:'))return url.href;
    }catch{}
    return 'poster-unavailable.svg';
  }
  function catalog(){
    const result=new Map(),items=read('animeVoidCatalog',[]);
    if(Array.isArray(items))for(const item of items){
      const id=idOf(item?.id);
      if(id&&!result.has(id))result.set(id,item);
    }
    return result;
  }
  function title(item,id){
    let value='';
    try{value=window.AVTitles?.display?.(item,ru()?'ru':'en')||''}catch{}
    if(!value)value=item?.title||item?.title_english||item?.title_romaji||'';
    if(!value)value=id?tr('Аниме №','Anime #')+id.replace(/^anilist-/,''):tr('Неизвестное аниме','Unknown anime');
    return String(value);
  }
  function collect(meta){
    const measured=[],manual=[];
    try{
      const raw=localStorage.getItem(ledger?.KEY||'animeVoidMeasuredV1');
      if(raw&&ledger){
        const archive=ledger.validate(JSON.parse(raw));
        for(const record of ledger.presentation(archive).entries){
          const percent=Math.min(100,ledger.count(record.coverage)/10);
          if(percent<=0)continue;
          const id=idOf(record.titleId),match=id?meta.get(id):null;
          const label=record.kind==='movie'?tr('Фильм','Movie')
            :tr('Сезон ','Season ')+record.season+' · '+tr('серия ','episode ')+record.episode;
          measured.push({
            name:record.title||title(match,id),
            label:label+' · '+percent.toFixed(1)+'% '+tr('подтверждено','verified'),
            percent,poster:safePoster(match?.image),
            href:id?'watch.html?id='+encodeURIComponent(id)+'&episode='+encodeURIComponent(record.episode):'history.html'
          });
          if(measured.length===3)break;
        }
      }
    }catch(error){console.warn('ANIME VOID: recent measured history unavailable',error);}
    // Manual marks have no reliable timestamps; do not label them as recent plays.
    // Manual-mark previews open episode 1 in the player, not the discussion page.
    // They never infer playback position or create an automatic watched mark.
    try{
      const entries=state?.metrics?.()?.titles||[];
      for(const entry of entries.slice().sort((a,b)=>(b.episodes?.length||0)-(a.episodes?.length||0))){
        if(!Array.isArray(entry.episodes)||!entry.episodes.length)continue;
        const id=idOf(entry.item?.id);
        if(!id)continue;
        const item=meta.get(id)||entry.item;
        manual.push({
          name:title(item,id),
          label:tr('Отмечено вручную: ','Manually marked: ')+entry.episodes.length+tr(' сер.',' ep.'),
          poster:safePoster(item?.image),href:'watch.html?id='+encodeURIComponent(id)+'&episode=1'
        });
        if(manual.length===3)break;
      }
    }catch(error){console.warn('ANIME VOID: recent manual marks unavailable',error);}
    return {measured,manual};
  }
  let selected='measured';
  function switcher(type,available){
    const group=el('div','av-48-recent-switch');
    group.setAttribute('role','group');
    group.setAttribute('aria-label',tr('Тип истории','History type'));
    for(const option of [
      {value:'measured',label:tr('Из плеера','From player')},
      {value:'manual',label:tr('Мои отметки','My marks')}
    ]){
      if(!available[option.value].length)continue;
      const button=el('button','',option.label);
      button.type='button';
      button.setAttribute('aria-pressed',String(option.value===type));
      button.addEventListener('click',()=>{
        if(selected===option.value)return;
        selected=option.value;render();
      });
      group.append(button);
    }
    return group;
  }
  function itemCard(item,type){
    const card=el('a','av-47-recent-item');
    card.href=item.href;
    const img=el('img');
    img.src=item.poster;img.alt='';img.loading='lazy';
    img.addEventListener('error',()=>{
      if(!img.src.endsWith('poster-unavailable.svg'))img.src='poster-unavailable.svg';
    },{once:true});
    const info=el('span','av-47-recent-info');
    info.append(el('strong','',item.name),el('small','',item.label));
    if(type==='measured'){
      const bar=el('span','av-48-recent-meter');
      bar.setAttribute('role','progressbar');
      bar.setAttribute('aria-label',tr('Подтверждённый просмотр','Verified playback'));
      bar.setAttribute('aria-valuemin','0');
      bar.setAttribute('aria-valuemax','100');
      bar.setAttribute('aria-valuenow',String(item.percent));
      const fill=el('span','av-48-recent-meter-fill');
      fill.style.width=item.percent.toFixed(1)+'%';
      bar.append(fill);info.append(bar);
    }
    const arrow=el('span','av-47-recent-arrow','↗');
    arrow.setAttribute('aria-hidden','true');
    card.append(img,info,arrow);
    return card;
  }
  function render(){
    const available=collect(catalog());
    if(!available.measured.length&&!available.manual.length){
      for(const host of hosts){host.hidden=true;host.replaceChildren();}
      return;
    }
    if(!available[selected].length)selected=available.measured.length?'measured':'manual';
    for(const host of hosts){
      const heading=el('div','av-47-recent-head');
      heading.append(el('h2','',selected==='measured'
        ?tr('Недавно в плеере','Recent playback')
        :tr('Мои отметки серий','My marked episodes')));
      const all=el('a','',tr('Вся история','Full history'));
      all.href='history.html';heading.append(all);
      const list=el('div','av-47-recent-list');
      for(const item of available[selected])list.append(itemCard(item,selected));
      host.hidden=false;
      if(available.measured.length&&available.manual.length){
        host.replaceChildren(heading,switcher(selected,available),list);
      }else{
        host.replaceChildren(heading,list);
      }
    }
  }
  let scheduled=false;
  function refresh(){
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{scheduled=false;try{render()}catch(error){
      console.warn('ANIME VOID: recent preview unavailable',error);
    }},120);
  }
  addEventListener('storage',event=>{
    if(event.storageArea!==localStorage)return;
    if(event.key===null||/^(?:animeVoid(?:MeasuredV1|Catalog|Language|LastWatch)|watched_)/.test(event.key))refresh();
  });
  addEventListener('av:measured',refresh);
  addEventListener('av:cloud-restored',refresh);
  addEventListener('pageshow',refresh);
  addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  render();
})();