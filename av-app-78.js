/* ANIME VOID V78 — accessible navigation for PWA, phones and desktop.
   Pure client-side navigation; never mutates accounts, catalog, history or playback. */
(()=>{'use strict';
 if(window.self!==window.top)return;
 const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 const home=path==='index.html',ru=()=>document.documentElement.lang!=='en';
 const labels={
  home:['Главная','Home'],search:['Поиск','Search'],match:['Для двоих','Match'],
  profile:['Профиль','Profile'],top:['Наверх','Back to top'],
  recent:['Продолжить','Continue'],calendar:['Расписание','Schedule'],history:['История','History'],
  library:['Мои списки','My lists'],explore:['Открытия','Explore'],install:['Установить приложение','Install app'],
  help:['На iPhone: «Поделиться» → «На экран Домой». На Android: меню браузера → «Установить приложение».',
        'On iPhone: Share → Add to Home Screen. On Android: browser menu → Install app.']
 };
 const t=k=>labels[k][ru()?0:1];
 const create=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e};
 const dock=create('nav','av78-dock');dock.id='av78Dock';dock.setAttribute('aria-label','ANIME VOID');
 const items=[
  ['home','⌂','index.html'],
  ['search','⌕','index.html#catalog'],
  ['match','♡','match.html'],
  ['history','↺','history.html'],
  ['profile','♙','profile.html']
 ];
 const links=new Map();
 for(const [key,icon,href] of items){
  const a=create('a','av78-dock-link');a.href=href;a.dataset.nav=key;
  const symbol=create('span','av78-dock-icon');symbol.textContent=icon;symbol.setAttribute('aria-hidden','true');
  const name=create('span','av78-dock-label');name.textContent=t(key);a.append(symbol,name);
  if(key==='home'&&home||key==='match'&&path==='match.html'||
   key==='history'&&path==='history.html'||key==='profile'&&path==='profile.html'||
   key==='search'&&['kodik.html','anime.html'].includes(path)){
   a.setAttribute('aria-current','page');
  }
  if(key==='search'&&home)a.addEventListener('click',event=>{
   const input=document.getElementById('search');
   if(!input)return;
   event.preventDefault();input.scrollIntoView({behavior:'smooth',block:'center'});
   try{input.focus({preventScroll:true})}catch{input.focus()}
  });
  links.set(key,a);dock.append(a);
 }
 document.body.append(dock);
 // One unobtrusive navigation hub, only on the homepage; reuse existing sections.
 let hub=null,hubLinks=[];
 if(home){
  const main=document.getElementById('av77Main')||document.querySelector('main');
  const anchor=document.getElementById('continueSection');
  if(main){
   hub=create('section','av78-hub');hub.id='av78Hub';hub.setAttribute('aria-label',ru()?'Твой аниме-мир':'Your anime space');
   const heading=create('div','av78-hub-heading');
   const eyebrow=create('span','av78-hub-eyebrow');eyebrow.textContent='ANIME VOID / YOUR SPACE';
   const h=create('h2');h.textContent=ru()?'Твой аниме-мир':'Your anime space';
   const sub=create('p');sub.textContent=ru()?'Быстрый доступ к тому, что тебе действительно нужно.':'Everything you need, one tap away.';
   heading.append(eyebrow,h,sub);hub.append(heading);
   const grid=create('div','av78-hub-grid');
   for(const [key,icon,href] of [
    ['recent','▶','#continueSection'],['library','☆','#favorites'],
    ['calendar','◷','#calendarSection'],['history','↺','history.html'],
    ['match','♡','match.html'],['explore','✧','explore.html']
   ]){
    const a=create('a','av78-hub-link');a.href=href;a.dataset.hub=key;
    const mark=create('span','av78-hub-symbol');mark.textContent=icon;mark.setAttribute('aria-hidden','true');
    const title=create('strong');title.textContent=t(key);
    const arrow=create('span','av78-hub-arrow');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
    a.append(mark,title,arrow);grid.append(a);hubLinks.push({a,title,key});
   }
   hub.append(grid);
   const hero=main.querySelector('.hero');
   if(hero)hero.insertAdjacentElement('afterend',hub);
   else main.prepend(hub);
   const refresh=()=>{
    for(const {a,key} of hubLinks){
     if(key==='recent'){
      const el=document.getElementById('continueSection');
      a.hidden=!el||el.hidden||getComputedStyle(el).display==='none'||!document.getElementById('continueCard')?.querySelector('h3');
     }
     if(key==='calendar'){
      const el=document.getElementById('calendarSection');
      a.hidden=!el||el.hidden||getComputedStyle(el).display==='none';
     }
    }
   };
   for(const id of ['continueSection','calendarSection']){
    const el=document.getElementById(id);
    if(el)new MutationObserver(refresh).observe(el,{attributes:true,attributeFilter:['style','hidden'],childList:true,subtree:true});
   }
   refresh();
  }
 }
 const up=create('button','av78-top');up.type='button';up.id='av78Top';
 up.textContent='↑';up.setAttribute('aria-label',t('top'));up.hidden=true;
 up.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
 document.body.append(up);
 let scheduled=false;
 const scroll=()=>{
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{up.hidden=window.scrollY<650;scheduled=false});
 };
 addEventListener('scroll',scroll,{passive:true});scroll();
 // Provide a real install control only where native browser install is supported.
 // iOS help is opt-in, not an unsolicited modal.
 let deferred=null;
 const install=document.getElementById('av77Install');
 addEventListener('beforeinstallprompt',event=>{deferred=event});
 addEventListener('appinstalled',()=>{deferred=null});
 if(home&&hub){
  const foot=create('div','av78-install-foot');
  const note=create('p');note.textContent=ru()?'Сайт можно установить как приложение на телефон.':'You can install this site as a phone app.';
  const details=create('details');details.className='av78-install-help';
  const summary=create('summary');summary.textContent=t('install');
  const help=create('p');help.textContent=t('help');
  details.append(summary,help);foot.append(note,details);hub.append(foot);
  const langUpdate=()=>{
   dock.setAttribute('aria-label',ru()?'Навигация ANIME VOID':'ANIME VOID navigation');
   for(const [key,a] of links)a.querySelector('.av78-dock-label').textContent=t(key);
   hub.setAttribute('aria-label',ru()?'Твой аниме-мир':'Your anime space');
   hub.querySelector('h2').textContent=ru()?'Твой аниме-мир':'Your anime space';
   hub.querySelector('.av78-hub-heading p').textContent=ru()?'Быстрый доступ к тому, что тебе действительно нужно.':'Everything you need, one tap away.';
   for(const {title,key} of hubLinks)title.textContent=t(key);
   up.setAttribute('aria-label',t('top'));note.textContent=ru()?'Сайт можно установить как приложение на телефон.':'You can install this site as a phone app.';
   summary.textContent=t('install');help.textContent=t('help');
  };
  new MutationObserver(langUpdate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  langUpdate();
 }else{
  new MutationObserver(()=>{
   for(const [key,a] of links)a.querySelector('.av78-dock-label').textContent=t(key);
   up.setAttribute('aria-label',t('top'));
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 }
})();
