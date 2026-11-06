/* ANIME VOID 46.0 — read-only viewing journal.
   Verified player records and manual episode marks remain separate.
   Do not write to localStorage or infer playback from an open page. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const safe=window.AVSafe, stateApi=window.AVState, ledger=window.AVWatchLedger;
  if(!safe||!stateApi||!ledger)return;
  const state={tab:'all',query:'',limit:24};
  let records={measured:[],marked:[],measuredMetrics:{seconds:0,units:0},manualTotal:0,titles:0};
  const isRu=()=>localStorage.getItem('animeVoidLanguage')!=='en';
  const tr=(ru,en)=>isRu()?ru:en;
  const fmt=n=>new Intl.NumberFormat(isRu()?'ru-RU':'en-US').format(n);
  const timeText=secs=>{
    const m=Math.floor(Math.max(0,secs)/60),h=Math.floor(m/60),r=m%60;
    return h?tr(h+' ч '+r+' мин',h+' h '+r+' min'):tr(m+' мин',m+' min');
  };
  const safeRead=(key,fallback)=>{try{return safe.read(key,fallback);}catch{return fallback;}};
  const canonical=value=>stateApi.canonicalId?.(value)||null;
  function safePoster(input){
    if(typeof input!=='string'||!input)return 'poster-unavailable.svg';
    if(input==='poster-unavailable.svg')return input;
    try{
      const u=new URL(input,location.href);
      if(u.protocol==='https:'||(u.origin===location.origin&&u.protocol==='http:'))return u.href;
    }catch{}
    return 'poster-unavailable.svg';
  }
  const nameFor=item=>{
    if(!item)return tr('Неизвестное аниме','Unknown anime');
    try{
      const value=window.AVTitles?.display?.(item,isRu()?'ru':'en');
      if(typeof value==='string'&&value.trim())return value.trim();
    }catch{}
    const value=isRu()?(item.title_romaji||item.title||item.title_english):(item.title_english||item.title||item.title_romaji);
    return typeof value==='string'&&value.trim()?value:tr('Неизвестное аниме','Unknown anime');
  };
  function buildRecords(){
    const catalog=safeRead('animeVoidCatalog',[]);
    const meta=new Map();
    if(Array.isArray(catalog)){
      for(const item of catalog){
        const id=canonical(item?.id);
        if(id&&!meta.has(id))meta.set(id,item);
      }
    }
    let measured=[],metrics={seconds:0,units:0,completed:0,titles:0};
    try{
      const raw=localStorage.getItem(ledger.KEY);
      if(raw){
        const archive=ledger.validate(JSON.parse(raw));
        // Match the profile totals: merge equivalent runtime records for a
        // single episode instead of counting the same viewing twice.
        const report=ledger.presentation(archive);
        metrics=report;
        measured=report.entries.map(record=>{
          const bins=ledger.count(record.coverage);
          return {
            key:[record.titleId,record.season,record.episode].join(':'),
            titleId:record.titleId,title:record.title,kind:record.kind,
            season:record.season,episode:record.episode,bins,
            percent:Math.min(100,bins/10),timestamp:record.updatedAt,
            position:record.position,duration:record.duration
          };
        });
      }
    }catch(error){console.warn('ANIME VOID: measured history unavailable',error);}
    let marked=[];
    try{
      const data=stateApi.metrics();
      const entries=Array.isArray(data?.titles)?data.titles:[];
      const last=canonical(safeRead('animeVoidLastWatch',null)?.animeId);
      marked=entries.filter(x=>Array.isArray(x?.episodes)&&x.episodes.length).map(entry=>{
        const id=canonical(entry.item?.id);
        if(!id)return null;
        const item=meta.get(id)||entry.item||{};
        const episodes=[...new Set(entry.episodes.map(Number).filter(n=>Number.isSafeInteger(n)&&n>0))].sort((a,b)=>a-b);
        const total=Number(item.episodes);
        const known=Number.isInteger(total)&&total>0&&total<=10000?total:null;
        const completion=stateApi.completion?.(episodes,known)||{percent:null};
        return{key:id,id,item,episodes,known,percent:completion.percent,minutes:Number(entry.minutes)||0,last:id===last};
      }).filter(Boolean).sort((a,b)=>Number(b.last)-Number(a.last)||b.episodes.length-a.episodes.length||String(a.id).localeCompare(String(b.id)));
    }catch(error){console.warn('ANIME VOID: marked history unavailable',error);}
    const titleIds=new Set([...marked.map(x=>x.id),...measured.map(x=>canonical(x.titleId)||x.titleId)]);
    records={measured,marked,measuredMetrics:metrics,manualTotal:marked.reduce((sum,item)=>sum+item.episodes.length,0),titles:titleIds.size,meta};
  }
  function elem(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  }
  function makeLink(url,label){
    const a=elem('a','',label);
    a.href=url;
    return a;
  }
  function recordCard({poster,title,description,sub,pill,pillType,percent,when,href,goText}){
    const card=elem('article','av-46-record');
    const image=elem('img','av-46-record-poster');
    image.src=safePoster(poster);
    image.alt='';
    image.loading='lazy';
    image.addEventListener('error',()=>{if(!image.src.endsWith('poster-unavailable.svg'))image.src='poster-unavailable.svg';},{once:true});
    card.append(image);
    const body=elem('div','av-46-record-main');
    body.append(elem('strong','',title));
    body.append(elem('span','av-46-record-meta',description));
    if(sub)body.append(elem('span','av-46-record-meta',sub));
    if(typeof percent==='number'&&Number.isFinite(percent)){
      const bar=elem('div','av-46-record-progress');
      bar.setAttribute('role','progressbar');
      bar.setAttribute('aria-valuemin','0');
      bar.setAttribute('aria-valuemax','100');
      bar.setAttribute('aria-valuenow',String(percent));
      bar.setAttribute('aria-label',tr('Отмеченный прогресс','Progress'));
      const fill=elem('span');
      fill.style.width=Math.min(100,Math.max(0,percent))+'%';
      bar.append(fill);body.append(bar);
    }
    const foot=elem('div','av-46-record-foot');
    const tag=elem('span','av-46-pill'+(pillType==='marked'?' av-46-manual-pill':''),pill);
    foot.append(tag);
    if(when){const date=elem('time','',when);foot.append(date);}
    body.append(foot);
    if(href){
      const actions=elem('div','av-46-record-actions');
      actions.append(makeLink(href,goText));
      body.append(actions);
    }
    card.append(body);return card;
  }
  function measuredCard(record){
    const id=canonical(record.titleId),item=id?records.meta.get(id):null;
    const movie=record.kind==='movie';
    const episode=movie?tr('Фильм','Movie'):tr('Сезон '+record.season+' · серия '+record.episode,'Season '+record.season+' · episode '+record.episode);
    const date=new Date(record.timestamp);
    const when=Number.isFinite(date.getTime())?date.toLocaleString(isRu()?'ru-RU':'en-US',{day:'numeric',month:'short',year:'numeric'}):'';
    const dest=id
      ? 'watch.html?id='+encodeURIComponent(id)+'&episode='+(movie?1:record.episode)
      : 'kodik.html';
    return recordCard({
      poster:item?.image,title:record.title||nameFor(item),
      description:episode,sub:tr('Подтверждено '+record.percent.toFixed(1)+'% видео','Verified '+record.percent.toFixed(1)+'% of video'),
      pill:tr('Замер плеера','Player measured'),pillType:'measured',
      percent:record.percent,when,href:dest,
      goText:id?tr(movie?'Открыть фильм':'Продолжить серию',movie?'Open movie':'Resume episode')
        :tr('Открыть каталог Kodik','Open Kodik catalog')
    });
  }
  function markedCard(record){
    const total=record.known;
    const episodeText=total
      ?tr(record.episodes.length+' из '+total+' серий',record.episodes.length+' of '+total+' episodes')
      :tr(record.episodes.length+' серий · общее число неизвестно',record.episodes.length+' episodes · total unknown');
    return recordCard({
      poster:record.item?.image,title:nameFor(record.item),description:episodeText,
      sub:tr('Последняя отметка: серия ','Last marked episode: ')+record.episodes.at(-1),
      pill:tr('Отмечено вручную','Manually marked'),pillType:'marked',
      percent:record.percent,when:null,
      href:'anime.html?id='+encodeURIComponent(record.id),
      goText:tr('Открыть серии','Open episodes')
    });
  }
  function updateContinue(){
    const section=$('av46Continue'),label=$('av46ContinueLabel'),link=$('av46ContinueLink');
    if(!section||!label||!link)return;
    const last=safeRead('animeVoidLastWatch',null);
    const markedId=canonical(last?.animeId);
    const recentMeasured=records.measured.find(record=>canonical(record.titleId));
    const id=markedId||canonical(recentMeasured?.titleId);
    if(!id){section.hidden=true;return;}
    const requestedEpisode=Number(markedId?last.episode:recentMeasured.episode);
    const ep=Number.isSafeInteger(requestedEpisode)&&requestedEpisode>0&&requestedEpisode<=10000?requestedEpisode:1;
    const title=nameFor(records.meta.get(id)||records.marked.find(x=>x.id===id)?.item
      ||{title:recentMeasured?.title||tr('Аниме №'+id.slice(8),'Anime #'+id.slice(8))});
    const isMovie=!markedId&&recentMeasured?.kind==='movie';
    label.textContent=(markedId?'':tr('Из плеера · ','From player · '))+title+' · '
      +(isMovie?tr('фильм','movie'):tr('серия '+ep,'episode '+ep));
    link.href='watch.html?id='+encodeURIComponent(id)+'&episode='+ep;
    section.hidden=false;
  }
  function language(){
    const ru=isRu();document.documentElement.lang=ru?'ru':'en';
    for(const el of document.querySelectorAll('[data-ru][data-en]'))el.textContent=ru?el.dataset.ru:el.dataset.en;
    $('av46HistorySearch').placeholder=tr('Поиск по названию...','Search by title...');
    $('av46HistorySearch').setAttribute('aria-label',tr('Поиск в истории','Search history'));
    document.title=tr('История просмотра — ANIME VOID','Watch history — ANIME VOID');
  }
  function render(){
    language();
    buildRecords();
    $('av46MeasuredTime').textContent=timeText(records.measuredMetrics.seconds||0);
    $('av46MeasuredUnits').textContent=fmt(records.measured.length);
    $('av46MarkedEpisodes').textContent=fmt(records.manualTotal);
    $('av46Titles').textContent=fmt(records.titles);
    updateContinue();
    const query=state.query.trim().toLocaleLowerCase(isRu()?'ru-RU':'en-US');
    const searchable=(text)=>!query||String(text).toLocaleLowerCase(isRu()?'ru-RU':'en-US').includes(query);
    const measured=records.measured.filter(item=>searchable(item.title+' '+nameFor(records.meta.get(canonical(item.titleId)))));
    const marked=records.marked.filter(item=>searchable(nameFor(item.item)));
    const measuredEnabled=state.tab!=='marked',markedEnabled=state.tab!=='measured';
    const total=(measuredEnabled?measured.length:0)+(markedEnabled?marked.length:0);
    // When both types exist, initially give each an equal share of the screen.
    const both=measuredEnabled&&markedEnabled&&measured.length>0&&marked.length>0;
    const firstLimit=both?Math.ceil(state.limit/2):state.limit;
    const visibleMeasured=measuredEnabled?measured.slice(0,firstLimit):[];
    const visibleMarked=markedEnabled?marked.slice(0,Math.max(0,state.limit-visibleMeasured.length)):[];
    const measuredSection=$('av46MeasuredSection'),markedSection=$('av46MarkedSection');
    measuredSection.hidden=!measuredEnabled||!measured.length;
    markedSection.hidden=!markedEnabled||!marked.length;
    $('av46MeasuredList').replaceChildren(...visibleMeasured.map(measuredCard));
    $('av46MarkedList').replaceChildren(...visibleMarked.map(markedCard));
    const shown=visibleMeasured.length+visibleMarked.length;
    $('av46ResultCount').textContent=tr('Показано '+shown+' из '+total+' записей','Showing '+shown+' of '+total+' records');
    for(const btn of document.querySelectorAll('[data-av-history-tab]')){
      btn.setAttribute('aria-pressed',String(btn.dataset.avHistoryTab===state.tab));
    }
    const empty=$('av46Empty');empty.hidden=total>0;
    if(!total){
      $('av46EmptyTitle').textContent=query?tr('Ничего не найдено','No results found')
        :state.tab==='measured'?tr('Замеров плеера пока нет','No measured playback yet')
        :state.tab==='marked'?tr('Пока нет отметок серий','No marked episodes yet')
        :tr('История пока пуста','No viewing records yet');
      $('av46EmptyDetail').textContent=query
        ?tr('Попробуй другое название или переключи тип записей.','Try another title or change the record type.')
        :state.tab==='measured'?tr('Серия появится здесь после подтверждённого просмотра в плеере.','An entry appears after verified viewing in the player.')
        :state.tab==='marked'?tr('Отметь просмотренную серию на странице аниме.','Mark an episode as watched on an anime page.')
        :tr('Когда ты отметишь серию или плеер подтвердит просмотр, запись появится здесь.','Mark an episode or watch a video in the player to see an entry here.');
    }
    const more=$('av46ShowMore');
    if(more){
      more.hidden=total<=shown;
      more.textContent=tr('Показать ещё ('+(total-shown)+')','Show more ('+(total-shown)+')');
    }
  }
  // Render at most a small page of cards; allow visitors to reveal the full local history.
  const more=elem('button','av-46-more');
  more.id='av46ShowMore';more.type='button';more.hidden=true;
  more.addEventListener('click',()=>{state.limit+=24;render();});
  $('av46Empty').before(more);
  for(const btn of document.querySelectorAll('[data-av-history-tab]')){
    btn.addEventListener('click',()=>{
      state.tab=btn.dataset.avHistoryTab;
      state.limit=24;
      render();
    });
  }
  $('av46HistorySearch').addEventListener('input',event=>{
    state.query=event.target.value.slice(0,120);state.limit=24;render();
  });
  let scheduled=false;
  function refresh(){
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{scheduled=false;render();},110);
  }
  addEventListener('av:cloud-restored',refresh);
  addEventListener('av:measured',refresh);
  addEventListener('pageshow',refresh);
  addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  addEventListener('storage',event=>{
    if(event.storageArea!==localStorage)return;
    if(event.key===null||/^(?:animeVoid(?:Catalog|MeasuredV1|LastWatch|Language|Favorites|Statuses|ListItems)|watched_|duration_)/.test(event.key))refresh();
  });
  render();
})();
