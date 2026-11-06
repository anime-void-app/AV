/* ANIME VOID 52.0 — browse the existing banner catalog and open the existing editors.
   Presentation only: no wallet, account, progress, achievement or ownership writes. */
(() => {
  'use strict';
  if(!document.body.classList.contains('av-profile-page'))return;
  const $=id=>document.getElementById(id);
  const ru=()=>document.documentElement.lang!=='en';
  const t=(a,b)=>ru()?a:b;
  const el=(tag,cls,content)=>{
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(content!==undefined)n.textContent=String(content);
    return n;
  };
  function fallback(){
    const workshop=$('profileWorkshop');
    if(workshop)workshop.scrollIntoView({behavior:'auto',block:'start'});
  }
  const buttons=[
    {icon:'✦',ru:'Изменить аватар',en:'Edit avatar',captionRu:'Свой образ',captionEn:'Your look',
      open:()=>typeof window.AVVisual?.open==='function'?window.AVVisual.open('avatar'):fallback()},
    {icon:'▧',ru:'Выбрать баннер',en:'Choose banner',captionRu:'Арт-ателье',captionEn:'Art Atelier',
      open:()=>typeof window.AVArtAtelier?.open==='function'?window.AVArtAtelier.open():fallback()},
    {icon:'◇',ru:'Ник и рамки',en:'Name & frames',captionRu:'Стили и титулы',captionEn:'Styles & titles',
      open:()=>typeof window.AVProfileNext?.identityEditor==='function'?window.AVProfileNext.identityEditor():fallback()},
    {icon:'♛',ru:'Достижения',en:'Achievements',captionRu:'Прогресс и награды',captionEn:'Progress & rewards',
      open:()=>{const a=$('profileAchievements');if(a)a.scrollIntoView({behavior:'auto',block:'start'});}}
  ];
  const quick=el('section','av52-quick');
  quick.id='av52Quick';
  quick.setAttribute('aria-labelledby','av52QuickTitle');
  const quickHead=el('div','av52-quick-head');
  const quickTitle=el('h2');quickTitle.id='av52QuickTitle';
  const quickIntro=el('p','av52-quick-intro');
  quickHead.append(quickTitle,quickIntro);
  const shortcuts=el('div','av52-quick-grid');
  for(const option of buttons){
    const control=el('button','av52-quick-item');
    control.type='button';
    control.append(el('span','av52-quick-icon',option.icon),el('span','av52-quick-copy'));
    control.addEventListener('click',option.open);
    option.control=control;
    shortcuts.append(control);
  }
  quick.append(quickHead,shortcuts);
  const hero=$('profileOverview');
  if(hero&& !$('av52Quick'))hero.insertAdjacentElement('afterend',quick);

  // The new section replaces only the old six-card gallery, not the user's assets or studio.
  const section=$('av49Gallery');
  let raw=[],view='new',query='',limit=12,loaded=false,status,grid,search,filters,more;
  function fileUrl(value){
    if(typeof value!=='string'||value.length>300||!/^(?:studio|image)\//.test(value))return 'poster-unavailable.svg';
    try{
      const url=new URL(value,location.href);
      return url.origin===location.origin?url.href:'poster-unavailable.svg';
    }catch{return 'poster-unavailable.svg';}
  }
  function owned(){
    try{return new Set((window.AVProfileStudio?.getBanners?.()||[]).filter(x=>x.owned).map(x=>x.id));}
    catch{return new Set();}
  }
  function equipped(){
    try{return window.AVProfileStudio?.getEquipped?.()?.banner||'';}
    catch{return '';}
  }
  const name=item=>Array.isArray(item.name)?String(item.name[ru()?0:1]||item.name[0]):String(item.name||item.id);
  function openBanner(item){
    if(typeof window.AVProfileStudio?.openCategory==='function'){
      window.AVProfileStudio.openCategory('banner',item.id);
    }else if(typeof window.AVArtAtelier?.open==='function'){
      window.AVArtAtelier.open();
    }else fallback();
  }
  function filtered(){
    const have=owned();
    const input=query.trim().toLocaleLowerCase();
    return raw.filter(item=>{
      if(view==='new'&&item.collection!=='v49')return false;
      if(view==='owned'&&!have.has(item.id))return false;
      if(input&&!name(item).toLocaleLowerCase().includes(input)&&
        !item.name?.join?.(' ').toLocaleLowerCase().includes(input))return false;
      return true;
    });
  }
  function render(){
    if(!loaded||!grid)return;
    const matches=filtered(),installed=equipped(),have=owned();
    grid.replaceChildren();
    for(const item of matches.slice(0,limit)){
      const card=el('button','av52-banner-card');
      card.type='button';card.dataset.bannerId=item.id;
      card.setAttribute('aria-label',t('Примерить баннер: ','Preview banner: ')+name(item));
      if(installed===item.id)card.classList.add('is-equipped');
      const img=el('img');
      img.src=fileUrl(item.asset);img.alt='';
      img.loading='lazy';img.decoding='async';
      const copy=el('span','av52-banner-caption');
      copy.append(el('strong','',name(item)));
      const statusTag=installed===item.id?t('Установлен','Equipped'):
        have.has(item.id)?t('В коллекции','Owned'):
        !Number(item.cost)?t('Бесплатно','Free'):
        Number(item.cost)+' ◈';
      copy.append(el('small','',statusTag));
      card.append(img,copy);
      card.addEventListener('click',()=>openBanner(item));
      grid.append(card);
    }
    if(!matches.length)grid.append(el('p','av52-no-results',
      view==='owned'?t('В этой категории пока нет доступных баннеров.','No owned banners in this category yet.'):
      t('Ничего не найдено. Измени поиск или фильтр.','No matches. Try a different search or filter.')));
    status.textContent=t('Показано ','Showing ')+Math.min(limit,matches.length)+t(' из ',' of ')+matches.length;
    more.hidden=matches.length<=limit;
    for(const b of filters.querySelectorAll('button')){
      b.setAttribute('aria-pressed',String(b.dataset.filter===view));
    }
  }
  function buildGallery(){
    if(!section||!raw.length)return;
    section.classList.add('av52-gallery');
    const head=el('div','av52-gallery-head');
    const eyebrow=el('small','av52-gallery-eyebrow');
    const title=el('h2');title.id='av49GalleryHeading';
    const desc=el('p','av52-gallery-description');
    const openAll=el('button','av52-gallery-launch');
    openAll.type='button';
    openAll.addEventListener('click',()=>typeof window.AVArtAtelier?.open==='function'?window.AVArtAtelier.open():fallback());
    head.append(el('div','av52-gallery-title'),openAll);
    head.firstChild.append(eyebrow,title,desc);
    const controls=el('div','av52-gallery-controls');
    filters=el('div','av52-gallery-tabs');
    filters.setAttribute('role','group');
    for(const [value,a,b] of [['new','Новинки','New'],['all','Все баннеры','All banners'],['owned','Мои','Owned']]){
      const button=el('button','');button.type='button';button.dataset.filter=value;
      button.addEventListener('click',()=>{view=value;limit=12;render();});
      button.dataset.labelRu=a;button.dataset.labelEn=b;
      filters.append(button);
    }
    const label=el('label','av52-gallery-search');
    const span=el('span','av52-sr-only');
    search=el('input');search.type='search';search.maxLength=80;
    search.autocomplete='off';search.value=query;
    search.addEventListener('input',()=>{query=search.value;limit=12;render();});
    label.append(span,search);
    controls.append(filters,label);
    status=el('p','av52-gallery-status');status.setAttribute('role','status');
    grid=el('div','av52-gallery-grid');
    more=el('button','av52-gallery-more');
    more.type='button';
    more.addEventListener('click',()=>{limit+=12;render();});
    section.replaceChildren(head,controls,status,grid,more);
    function translate(){
      eyebrow.textContent=t('PROFILE STUDIO / КОЛЛЕКЦИЯ','PROFILE STUDIO / COLLECTION');
      title.textContent=t('Баннеры твоей вселенной','Banners for your universe');
      desc.textContent=t('Выбирай оформление и открывай его в мастерской. Старые покупки и выбранный баннер сохраняются.',
        'Browse styles and open them in Studio. Your earlier purchases and chosen banner stay intact.');
      openAll.textContent=t('Открыть арт-ателье','Open Art Atelier');
      span.textContent=t('Поиск по баннерам','Search banners');
      search.placeholder=t('Найти баннер…','Find a banner…');
      for(const button of filters.querySelectorAll('button')){
        button.textContent=ru()?button.dataset.labelRu:button.dataset.labelEn;
      }
      more.textContent=t('Показать ещё','Show more');
      render();
    }
    translate();
    section.av52Translate=translate;
  }
  async function loadGallery(){
    if(!section)return;
    try{
      const response=await fetch('profile-catalog.json?v=49.0',{credentials:'same-origin'});
      if(!response.ok)throw Error('catalog unavailable');
      const data=await response.json();
      if(!Array.isArray(data.items))throw Error('invalid catalog');
      raw=data.items.filter(x=>x?.kind==='banner'&&!x.hidden&&!x.retired24&&!x.ownerOnly&&
        (!x.vipOnly||window.AVVIP23?.allowed?.()===true)&&typeof x.id==='string'&&
        Array.isArray(x.name)&&typeof x.asset==='string');
      raw.sort((a,b)=>Number(b.collection==='v49')-Number(a.collection==='v49'));
      loaded=true;
      buildGallery();
    }catch(error){
      console.warn('ANIME VOID: expanded banner gallery unavailable; original six previews remain.',error);
    }
  }
  const achievements=$('profileAchievements');
  if(achievements)achievements.classList.add('av52-achievements');
  const workshop=$('profileWorkshop');
  if(workshop)workshop.classList.add('av52-workshop');
  function translateQuick(){
    quickTitle.textContent=t('Настрой своё пространство','Customize your space');
    quickIntro.textContent=t('Все редакторы в одном месте — без изменения истории или покупок.',
      'All editors in one place, without changes to viewing history or purchases.');
    for(const b of buttons){
      const copy=b.control.querySelector('.av52-quick-copy');
      copy.replaceChildren(el('strong','',t(b.ru,b.en)),el('small','',t(b.captionRu,b.captionEn)));
    }
  }
  translateQuick();
  let lastLang=document.documentElement.lang;
  new MutationObserver(()=>{
    if(lastLang===document.documentElement.lang)return;
    lastLang=document.documentElement.lang;
    translateQuick();
    section?.av52Translate?.();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  for(const type of ['av:appearance','av:banner-equipped','av:cloud-restored','pageshow']){
    addEventListener(type,()=>render());
  }
  addEventListener('storage',event=>{
    if(event.key==='animeVoidStudioV1'||event.key==='animeVoidLanguage')render();
  });
  void loadGallery();
})();