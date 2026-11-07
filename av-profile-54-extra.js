/* ANIME VOID 54.0 — profile section shortcuts and achievement quick filters.
   Reads existing achievement tracker UI; does not award, store or alter achievements. */
(() => {
  'use strict';
  if(!document.body.classList.contains('av-profile-page'))return;
  const $=id=>document.getElementById(id);
  const ru=()=>document.documentElement.lang!=='en';
  const t=(a,b)=>ru()?a:b;
  const el=(tag,cls,text)=>{
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)n.textContent=text;
    return n;
  };
  const nav=$('profileSectionNav');
  const gallery=$('av49Gallery');
  let bannerLink=null;
  if(nav&&gallery&&!nav.querySelector('a[href="#av49Gallery"]')){
    bannerLink=el('a','av54-banners-navigation',t('🖼️ Баннеры','🖼️ Banners'));
    bannerLink.href='#av49Gallery';
    const workshop=nav.querySelector('a[href="#profileWorkshop"]');
    if(workshop)workshop.insertAdjacentElement('afterend',bannerLink);
    else nav.append(bannerLink);
  }
  function activeNav(){
    if(!nav)return;
    const list=[...nav.querySelectorAll('a[href^="#"]')];
    const found=list.find(x=>x.getAttribute('href')===location.hash);
    const selected=found||list.find(x=>x.getAttribute('href')==='#profileOverview');
    for(const link of list){
      if(link===selected)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
    if(selected&&window.matchMedia?.('(max-width:760px)')?.matches){
      const rect=selected.getBoundingClientRect(),box=nav.getBoundingClientRect();
      if(rect.left<box.left+10)nav.scrollLeft+=rect.left-box.left-10;
      else if(rect.right>box.right-10)nav.scrollLeft+=rect.right-box.right+10;
    }
  }
  addEventListener('hashchange',activeNav,{passive:true});
  activeNav();

  const achievements=$('profileAchievements'),root=$('achievementsGrid');
  if(!achievements||!root||$('av54AchievementTools'))return;
  const section=el('div','av54-achievement-tools');
  section.id='av54AchievementTools';
  const top=el('div','av54-achievement-intro');
  const title=el('strong'),counter=el('span','av54-achievement-counter','—');
  top.append(title,counter);
  const bar=el('div','av54-achievement-bar');
  bar.setAttribute('role','progressbar');
  bar.setAttribute('aria-valuemin','0');
  bar.setAttribute('aria-valuemax','100');
  const fill=el('span');bar.append(fill);
  const buttons=el('div','av54-achievement-buttons');
  buttons.setAttribute('role','group');
  const buttonSpecs=[
    {id:'all',ru:'Все',en:'All',status:'all'},
    {id:'earned',ru:'Открытые',en:'Unlocked',status:'earned'},
    {id:'locked',ru:'Закрытые',en:'Locked',status:'locked'},
    {id:'near',ru:'Близко к открытию',en:'Closest',status:'locked',sort:'near'}
  ];
  function controls(){
    return {
      status:root.querySelector('.a22-controls select[data-filter="status"]'),
      sort:root.querySelector('.a22-controls select[data-filter="sort"]')
    };
  }
  function clickFilter(option){
    const x=controls();
    if(!x.status){
      root.scrollIntoView({behavior:'auto',block:'start'});
      return;
    }
    if(option.sort){
      if(x.sort){x.sort.value=option.sort;x.sort.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    x.status.value=option.status;
    x.status.dispatchEvent(new Event('change',{bubbles:true}));
    root.scrollIntoView({behavior:'auto',block:'start'});
    sync();
  }
  for(const spec of buttonSpecs){
    const button=el('button','');
    button.type='button';button.dataset.filter=spec.id;
    button.addEventListener('click',()=>clickFilter(spec));
    buttons.append(button);spec.button=button;
  }
  section.append(top,bar,buttons);
  const heading=achievements.querySelector('.section-heading');
  if(heading)heading.insertAdjacentElement('afterend',section);
  else root.insertAdjacentElement('beforebegin',section);

  function sync(){
    const label=root.querySelector('.a22-summary');
    const match=label?.textContent?.match(/(\d+)\s*\/\s*(\d+)/);
    if(match){
      const done=Number(match[1]),total=Number(match[2]);
      const pct=total>0?Math.max(0,Math.min(100,Math.round(done/total*100))):0;
      counter.textContent=t('Открыто ','Unlocked ')+done+' / '+total+' · '+pct+'%';
      fill.style.width=pct+'%';
      bar.setAttribute('aria-valuenow',String(pct));
      bar.setAttribute('aria-label',t('Прогресс достижений','Achievement progress'));
    }else{
      counter.textContent=t('Награды и прогресс','Rewards & progress');
      fill.style.width='0%';
      bar.setAttribute('aria-valuenow','0');
    }
    const c=controls();
    for(const spec of buttonSpecs){
      const on=c.status?.value===spec.status && (spec.sort?c.sort?.value===spec.sort:spec.id!=='locked'||c.sort?.value!=='near');
      spec.button.setAttribute('aria-pressed',String(Boolean(on)));
    }
  }
  function translate(){
    title.textContent=t('Путь достижений','Achievement journey');
    bannerLink&&(bannerLink.textContent=t('🖼️ Баннеры','🖼️ Banners'));
    buttons.setAttribute('aria-label',t('Фильтры достижений','Achievement filters'));
    for(const spec of buttonSpecs)spec.button.textContent=t(spec.ru,spec.en);
    sync();
  }
  let scheduled=false;
  function scheduledSync(){
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;sync();});
  }
  const watcher=new MutationObserver(scheduledSync);
  watcher.observe(root,{childList:true,subtree:true,characterData:true});
  root.addEventListener('change',scheduledSync,true);
  addEventListener('av:rewards',scheduledSync);
  addEventListener('pageshow',scheduledSync);
  let previous=document.documentElement.lang;
  new MutationObserver(()=>{
    if(previous===document.documentElement.lang)return;
    previous=document.documentElement.lang;
    translate();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();