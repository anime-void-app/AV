/* ANIME VOID 66.0 — player-page navigation enhancement.
   Does not alter player providers, media streams, watch-history writes,
   rewards, account sessions, or episode-validation logic. */
(() => {
  'use strict';
  if (!document.body?.classList.contains('av-watch-page')) return;
  const player=document.getElementById('avPlayer');
  const details=document.querySelector('details.avp2-tracker');
  const grid=document.getElementById('episodeGrid');
  const episodes=details?.querySelector('.episodes');
  const controls=details?.querySelector('.controls');
  const title=document.getElementById('animeTitle');
  const episodeTitle=document.getElementById('episodeTitle');
  if(!player||!details||!grid||!episodes||!controls)return;
  if(document.getElementById('avWatch57Nav'))return;

  const en=()=>document.documentElement.lang==='en';
  const T=(ru,eng)=>en()?eng:ru;
  const make=(tag,className,text)=>{
    const x=document.createElement(tag);
    if(className)x.className=className;
    if(text!==undefined)x.textContent=String(text);
    return x;
  };
  // Keep the *same buttons and listeners*. No duplicated marking or save actions.
  const toolbar=make('section','av-watch57-toolbar');
  toolbar.id='avWatch57Nav';
  toolbar.setAttribute('aria-label',T('Управление просмотром','Watch navigation'));
  const heading=make('div','av-watch57-toolbar-title');
  const kicker=make('span','av-watch57-kicker');
  const help=make('p','av-watch57-hint');
  const current=make('span','av-watch66-current');
  current.setAttribute('role','status');
  current.setAttribute('aria-live','polite');
  heading.append(kicker,help,current);
  const links=make('div','av-watch57-toolbar-links');
  const back=make('a','av-watch57-link');
  back.href='index.html#catalog';
  const journal=make('a','av-watch57-link');
  journal.href='history.html';
  const together=make('a','av-watch57-link');
  const information=make('a','av-watch57-link');
  const id=new URLSearchParams(location.search).get('id');
  const validId=/^(?:anilist-)?[1-9]\d*$/.test(String(id||''));
  information.href=validId?'anime.html?id='+encodeURIComponent(id):'index.html';
  together.href=validId?'party.html?anime='+encodeURIComponent(id):'party.html';
  links.append(back,journal,together,information);
  toolbar.append(heading,controls,links);
  player.insertAdjacentElement('afterend',toolbar);
  controls.classList.add('av-watch57-controls');

  // Episode buttons are originally created by the validated title renderer.
  // Work with those existing buttons instead of generating links from untrusted input.
  const pageSize=36;
  let page=0, lastActive=0, lastLength=0, syncQueued=false, count=0;
  const pager=make('nav','av-watch57-pager');
  pager.setAttribute('aria-label',T('Страницы эпизодов','Episode pages'));
  const previous=make('button','av-watch57-page-btn');
  const next=make('button','av-watch57-page-btn');
  const searchLabel=make('label','av-watch57-jump');
  const searchCaption=make('span','av-watch57-sr-only');
  const search=make('input','av-watch57-input');
  search.type='number';search.min='1';search.step='1';search.inputMode='numeric';
  search.autocomplete='off';
  search.setAttribute('aria-label',T('Номер серии','Episode number'));
  const jump=make('button','av-watch57-page-btn av-watch57-go');
  jump.type='button';
  previous.type='button';next.type='button';
  searchLabel.append(searchCaption,search);
  const status=make('span','av-watch57-pager-status');
  status.setAttribute('role','status');
  pager.append(previous,status,next,searchLabel,jump);
  grid.insertAdjacentElement('beforebegin',pager);

  const watchButtons=()=>[...grid.children].filter(x=>x.matches('button.episode'));
  function applyPage(){
    const buttons=watchButtons();
    count=buttons.length;
    if(!count){pager.hidden=true;return;}
    page=Math.max(0,Math.min(page,Math.ceil(count/pageSize)-1));
    const first=page*pageSize;
    buttons.forEach((button,i)=>{
      button.hidden=i<first||i>=first+pageSize;
      if(!button.hidden)button.setAttribute('aria-current',button.classList.contains('active')?'true':'false');
    });
    pager.hidden=false;
    previous.disabled=page===0;
    next.disabled=page>=Math.ceil(count/pageSize)-1;
    search.max=String(count);
    search.placeholder=T('Серия 1–','Episode 1–')+count;
    status.textContent=T('Серии ','Episodes ')+(first+1)+'–'+Math.min(first+pageSize,count)+' '+T('из ','of ')+count;
  }
  function sync(){
    const buttons=watchButtons();
    const selected=buttons.findIndex(x=>x.classList.contains('active'))+1;
    if(selected>0&&(selected!==lastActive||buttons.length!==lastLength)){
      page=Math.floor((selected-1)/pageSize);
      lastActive=selected;
    }else if(buttons.length!==lastLength&&page>Math.ceil(buttons.length/pageSize)-1){
      page=0;
    }
    lastLength=buttons.length;
    applyPage();
  }
  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    queueMicrotask(()=>{syncQueued=false;sync();});
  }
  previous.addEventListener('click',()=>{page=Math.max(0,page-1);applyPage();});
  next.addEventListener('click',()=>{page+=1;applyPage();});
  function jumpToEpisode(){
    const n=Number(search.value);
    if(!Number.isSafeInteger(n)||n<1||n>count){
      search.setCustomValidity(T('Укажи номер доступной серии','Enter an available episode number'));
      search.reportValidity();
      return;
    }
    search.setCustomValidity('');
    const button=watchButtons()[n-1];
    if(!button)return;
    page=Math.floor((n-1)/pageSize);
    applyPage();
    button.click();
    search.value='';
  }
  search.addEventListener('input',()=>search.setCustomValidity(''));
  search.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();jumpToEpisode();}
  });
  jump.addEventListener('click',jumpToEpisode);
  new MutationObserver(scheduleSync).observe(grid,{childList:true});
  addEventListener('av:progress',scheduleSync);
  addEventListener('pageshow',scheduleSync);

  const summary=details.querySelector('summary');
  // Only description text changes; native <details> semantics are preserved.
  const sourcesNote=make('p','av-watch57-source-note');
  sourcesNote.setAttribute('role','note');
  const top=document.querySelector('.watch-top');
  top?.insertAdjacentElement('afterend',sourcesNote);
  function updateCurrent(){
    if(!episodeTitle){current.hidden=true;return;}
    const name=episodeTitle.textContent.trim();
    current.hidden=!name;
    current.textContent=name?T('Сейчас открыто: ','Currently open: ')+name:'';
  }
  // The validated page handler owns title and episode selection; this is
  // read-only presentation for keyboard and mobile users.
  if(episodeTitle)new MutationObserver(updateCurrent).observe(episodeTitle,{childList:true,characterData:true,subtree:true});
  const localized=()=>{
    toolbar.setAttribute('aria-label',T('Управление просмотром','Watch navigation'));
    kicker.textContent=T('АНИМЕ / ПРОСМОТР','ANIME / WATCH');
    help.textContent=T('Переключай серии, не раскрывая настройки. Отметки не равны фактическому времени просмотра.',
      'Switch episodes without opening settings. Episode marks are not measured watch time.');
    back.textContent=T('← В каталог','← Catalog');
    journal.textContent=T('История просмотра','Watch history');
    together.textContent=T('🎬 Смотреть вместе','🎬 Watch together');
    information.textContent=T('Описание и обсуждение','Details & discussion');
    previous.textContent=T('← Раньше','← Earlier');
    next.textContent=T('Позже →','Later →');
    jump.textContent=T('Перейти','Go');
    searchCaption.textContent=T('Перейти к серии','Jump to an episode');
    search.setAttribute('aria-label',T('Номер серии','Episode number'));
    pager.setAttribute('aria-label',T('Страницы эпизодов','Episode pages'));
    if(summary){
      summary.dataset.ru='Список серий и мои отметки';
      summary.dataset.en='Episodes & my marks';
      summary.textContent=T('Список серий и мои отметки','Episodes & my marks');
    }
    sourcesNote.textContent=T('Видео доступно только при подключённом источнике. Кнопка отметки меняет список серий; подтверждённый просмотр учитывается отдельно, если плеер его поддерживает.',
      'Video requires a connected source. Episode marks update your list; verified playback is tracked separately when supported.');
    updateCurrent();
    applyPage();
  };
  // Intro must not be mistaken for verified playback.
  localized();
  let previousLang=document.documentElement.lang;
  new MutationObserver(()=>{
    if(previousLang===document.documentElement.lang)return;
    previousLang=document.documentElement.lang;
    localized();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  sync();
})();