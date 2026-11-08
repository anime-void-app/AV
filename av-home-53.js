/* ANIME VOID 62.0 — usable home layout and catalog controls.
   Keeps all existing player, catalog, favorites, account and cloud handlers.
   Only the new animeVoidHomeCardsV53 preference is written. */
(() => {
  'use strict';
  const body=document.body;
  if(!body?.classList?.contains('av-home'))return;
  const $=id=>document.getElementById(id);
  const ru=()=>document.documentElement.lang!=='en';
  const t=(a,b)=>ru()?a:b;
  const node=(tag,cls,text)=>{
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)n.textContent=String(text);
    return n;
  };
  const localized=[];
  const copy=(tag,cls,a,b)=>{
    const n=node(tag,cls,t(a,b));
    localized.push({n,a,b});
    return n;
  };
  function translate(){
    for(const {n,a,b} of localized)n.textContent=t(a,b);
    if(searchAction)searchAction.setAttribute('aria-label',t('Перейти к поиску аниме','Go to anime search'));
    if(continueAction)continueAction.setAttribute('aria-label',t('Перейти к продолжению просмотра','Go to continue watching'));
  }

  const catalog=$('catalog'),continueSection=$('continueSection'),watchBanner=$('avWatchAvailable');
  if(catalog&&continueSection){
    // The existing catalog was below several seasonal carousels.
    // Move only the two existing nodes, keeping their IDs and event handlers.
    continueSection.insertAdjacentElement('afterend',catalog);
    if(watchBanner)continueSection.insertAdjacentElement('afterend',watchBanner);
  }

  const links=$('av46HomeLinks'),search=$('search');
  let searchAction=null,continueAction=null;
  if(links&&!$('av53QuickIntro')){
    links.classList.add('av53-home-links');
    const head=node('div','av53-links-head');head.id='av53QuickIntro';
    const titles=node('div','av53-links-title');
    titles.append(
      copy('span','av53-eyebrow','ТВОЙ БЫСТРЫЙ СТАРТ','YOUR QUICK START'),
      copy('h2','', 'Что хочешь посмотреть сегодня?','What will you watch today?'),
      copy('p','', 'Поиск, история, списки и профиль — всё рядом.','Search, history, lists and profile in one place.')
    );
    const tools=node('div','av53-links-tools');
    if(search){
      searchAction=copy('button','av53-search-action','⌕ Найти аниме','⌕ Find anime');
      searchAction.type='button';
      searchAction.addEventListener('click',()=>{
        search.focus({preventScroll:true});
        const header=document.querySelector('body > header');
        header?.scrollIntoView({block:'start',behavior:'auto'});
      });
      tools.append(searchAction);
    }
    const partyAction=copy('a','av53-party-action','🎬 Смотреть вместе','🎬 Watch together');
    partyAction.href='party.html';
    tools.append(partyAction);
    if(continueSection){
      continueAction=copy('a','av53-continue-action','▶ Продолжить','▶ Continue');
      continueAction.href='#continueSection';
      continueAction.hidden=true;
      tools.append(continueAction);
    }
    head.append(titles,tools);
    links.prepend(head);
  }
  // A continuation shortcut is shown only if a real continuation card is rendered.
  if(continueSection&&continueAction){
    const card=$('continueCard');
    const syncContinue=()=>{
      const visible=!continueSection.hidden &&
        getComputedStyle(continueSection).display!=='none' &&
        Boolean(card?.querySelector('h3'));
      continueAction.hidden=!visible;
      continueAction.parentElement?.classList.toggle('av53-no-continue',!visible);
    };
    syncContinue();
    const observer=new MutationObserver(syncContinue);
    observer.observe(continueSection,{attributes:true,attributeFilter:['style','hidden'],childList:true,subtree:true});
    addEventListener('pageshow',syncContinue);
  }

  const prefKey='animeVoidHomeCardsV53';
  function preference(){
    try{return localStorage.getItem(prefKey)==='large'?'large':'grid'}catch{return 'grid'}
  }
  const viewButtons=[];
  function setView(mode,write){
    const selected=mode==='large'?'large':'grid';
    body.classList.toggle('av53-large-cards',selected==='large');
    for(const b of viewButtons){
      b.setAttribute('aria-pressed',String(b.dataset.cardView===selected));
    }
    if(write){
      try{localStorage.setItem(prefKey,selected)}catch(error){
        // Browser privacy settings may forbid storage: the view still works now.
      }
    }
  }
  const heading=catalog?.querySelector('.section-heading');
  if(heading&&!$('av53CardViews')){
    const controls=node('div','av53-view-controls');
    controls.id='av53CardViews';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label',t('Размер карточек','Card size'));
    const label=copy('span','av53-view-label','Вид карточек','Card layout');
    controls.append(label);
    for(const [mode,rus,eng] of [
      ['grid','▦ Сетка','▦ Grid'],
      ['large','▤ Крупно','▤ Large']
    ]){
      const b=copy('button','av53-view-option',rus,eng);
      b.type='button';
      b.dataset.cardView=mode;
      b.addEventListener('click',()=>setView(mode,true));
      controls.append(b);
      viewButtons.push(b);
    }
    heading.append(controls);
  }
  setView(preference(),false);
  addEventListener('storage',event=>{
    if(event.key===prefKey&&event.storageArea===localStorage)setView(preference(),false);
  });
  addEventListener('pageshow',event=>{
    if(event.persisted)setView(preference(),false);
  });

  const searchSuggestions=$('searchSuggestions');
  document.addEventListener('keydown',event=>{
    if(event.key!=='/'||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey||event.isComposing)return;
    const target=event.target;
    if(target?.isContentEditable||/^(?:INPUT|TEXTAREA|SELECT)$/.test(target?.tagName||''))return;
    if(document.querySelector('dialog[open]'))return;
    if(!search)return;
    event.preventDefault();
    search.focus();
  });
  search?.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&searchSuggestions?.hidden)search.blur();
  });

  let lastLang=document.documentElement.lang;
  const onLanguage=()=>{
    if(lastLang===document.documentElement.lang)return;
    lastLang=document.documentElement.lang;
    translate();
    $('av53CardViews')?.setAttribute('aria-label',t('Размер карточек','Card size'));
  };
  new MutationObserver(onLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();