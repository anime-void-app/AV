/* ANIME VOID / 16 — accessible navigation and presentation. No new progress store. */
(()=>{'use strict';
const ru=()=>document.documentElement.lang!=='en',home=document.body.classList.contains('av-home');
const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch(e){return fallback;}};
const themes=[['dark','☾','Тёмная','Dark'],['light','☀','Лавандовая','Lavender'],['sakura','❀','Сакура','Sakura'],['ocean','≈','Океан','Ocean'],['forest','♧','Лесная','Forest']];
function themeSync(){const id=themes.some(x=>x[0]===read('animeVoidTheme','dark'))?read('animeVoidTheme','dark'):'dark';const desired={'theme-light':id!=='dark','theme-sakura':id==='sakura','theme-ocean':id==='ocean','theme-forest':id==='forest'};for(const[k,v]of Object.entries(desired))if(document.body.classList.contains(k)!==v)document.body.classList.toggle(k,v);if(document.body.dataset.avTheme!==id)document.body.dataset.avTheme=id;for(const b of document.querySelectorAll('#themeToggle,#guideTheme')){b.textContent=themes.find(x=>x[0]===id)[1];b.setAttribute('aria-label',ru()?'Выбрать тему':'Choose theme');}const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=getComputedStyle(document.body).getPropertyValue('--av-bg').trim();}
let menu=null,themeInvoker=null;
function closeTheme(restore=false){if(!menu)return;menu.remove();menu=null;themeInvoker?.setAttribute('aria-expanded','false');if(restore)themeInvoker?.focus();}
function openTheme(button){if(menu){closeTheme();return;}themeInvoker=button;button.setAttribute('aria-expanded','true');menu=document.createElement('div');menu.className='theme-menu av-theme-panel';menu.setAttribute('role','menu');menu.setAttribute('aria-label',ru()?'Цветовая тема':'Color theme');for(const[id,icon,r,e]of themes){const b=document.createElement('button');b.type='button';b.className='theme-option';b.textContent=icon+'  '+(ru()?r:e);b.setAttribute('role','menuitemradio');b.setAttribute('aria-checked',String(read('animeVoidTheme','dark')===id));b.onclick=()=>{try{localStorage.setItem('animeVoidTheme',id);}catch(err){}themeSync();closeTheme(true);document.dispatchEvent(new Event('av:theme'));};menu.append(b);}document.body.append(menu);const rect=button.getBoundingClientRect(),width=Math.min(220,innerWidth-24);menu.style.cssText='position:fixed;top:'+Math.max(12,Math.min(rect.bottom+8,innerHeight-300))+'px;right:'+Math.max(12,Math.min(innerWidth-width-12,innerWidth-rect.right))+'px;width:'+width+'px;padding:8px;border-radius:14px';menu.querySelector('[aria-checked="true"]')?.focus();}
document.addEventListener('click',e=>{const b=e.target.closest('#themeToggle,#guideTheme');if(b){e.preventDefault();e.stopImmediatePropagation();openTheme(b);return;}if(menu&&!menu.contains(e.target))closeTheme();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeTheme(true);document.querySelector('.decor-menu')?.remove();closeTools(true);}if(menu&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const list=[...menu.querySelectorAll('button')];let n=list.indexOf(document.activeElement);n=e.key==='Home'?0:e.key==='End'?list.length-1:(n+(e.key==='ArrowDown'?1:-1)+list.length)%list.length;list[n].focus();}});
const main=document.querySelector('main');if(main){if(!main.id)main.id='mainContent';const skip=document.createElement('a');skip.className='av-skip';skip.href='#'+main.id;skip.dataset.ru='К содержимому';skip.dataset.en='Skip to content';skip.classList.add('av-copy');document.body.prepend(skip);main.setAttribute('tabindex','-1');}
const header=document.querySelector('header');if(header&&!location.pathname.endsWith('/updates.html')){const a=document.createElement('a');a.href='updates.html';a.className='av-copy av-updates-header';a.dataset.ru='Что нового';a.dataset.en='Updates';(home?header.querySelector('nav'):header)?.append(a);}
let toolsButton=null;
function closeTools(focus=false){const h=document.querySelector('header');if(!h?.classList.contains('av-tools-open'))return;h.classList.remove('av-tools-open');toolsButton?.setAttribute('aria-expanded','false');if(focus)toolsButton?.focus();}
if(home){const h=document.querySelector('header'),panel=document.createElement('div');panel.className='av-header-panel';panel.id='avHeaderPanel';for(const node of [h.querySelector(':scope > nav'),h.querySelector('.language-switch'),h.querySelector('#decorToggle')])if(node)panel.append(node);h.append(panel);toolsButton=document.createElement('button');toolsButton.type='button';toolsButton.className='av-menu-toggle';toolsButton.textContent='☰';toolsButton.setAttribute('aria-controls',panel.id);toolsButton.setAttribute('aria-expanded','false');toolsButton.onclick=()=>{const expanded=h.classList.toggle('av-tools-open');toolsButton.setAttribute('aria-expanded',String(expanded));};h.append(toolsButton);panel.addEventListener('click',e=>{if(e.target.closest('a'))closeTools();});document.addEventListener('click',e=>{if(!h.contains(e.target))closeTools();});matchMedia('(min-width:761px)').addEventListener('change',()=>closeTools());}
const icons={catalog:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',mood:'<path d="M12 3v5m0 8v5M3 12h5m8 0h5M5.5 5.5l3 3m7 7 3 3m0-13-3 3m-7 7-3 3"/><circle cx="12" cy="12" r="3"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',updates:'<path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/>'};
const nav=document.createElement('nav');nav.className='av-mobile-nav';nav.setAttribute('aria-label','Основная навигация');const navItems=[['catalog',home?'#catalog':'index.html#catalog','Каталог','Catalog'],['mood',home?'#moodSection':'index.html#moodSection','Подбор','Discover'],['profile','profile.html','Моё','My space'],['updates','updates.html','Что нового','Updates']];for(const[id,href,r,e]of navItems){const a=document.createElement('a');a.href=href;a.dataset.avNav=id;a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[id]+'</svg><span class="av-copy" data-ru="'+r+'" data-en="'+e+'"></span>';nav.append(a);}document.body.append(nav);
function markNavigation(){for(const a of nav.querySelectorAll('a')){const id=a.dataset.avNav;const active=(id==='profile'&&location.pathname.endsWith('/profile.html'))||(id==='updates'&&location.pathname.endsWith('/updates.html'))||(home&&id===(location.hash==='#moodSection'?'mood':'catalog'));if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
function revealHash(){try{const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));const details=target?.closest('details');if(details)details.open=true;}catch(e){}}
addEventListener('hashchange',()=>{markNavigation();revealHash();});revealHash();document.querySelector('#myJourney')?.addEventListener('toggle',e=>{if(e.target.open)document.dispatchEvent(new Event('av:charts-visible'));});
for(const footer of document.querySelectorAll('footer')){const links=document.createElement('div');links.className='av-footer-links';for(const[href,r,e]of [['updates.html','Что нового','What’s new'],['monogatari-order.html','Гайд по Моногатари','Monogatari guide'],['index.html#backupSection','Резервная копия','Back up your data']]){const a=document.createElement('a');a.href=href;a.className='av-copy';a.dataset.ru=r;a.dataset.en=e;links.append(a);}footer.append(links);}
document.querySelector('#otakuPath')?.setAttribute('tabindex','0');
function labels(){const path=document.querySelector('#otakuPath');if(path){path.setAttribute('role','region');path.setAttribute('aria-label',ru()?'Путь отаку — листай стрелками':'Otaku path — scroll with arrow keys');}const search=document.getElementById('search');if(search)search.setAttribute('aria-label',ru()?'Поиск аниме':'Search anime');for(const node of document.querySelectorAll('.av-copy')){const value=ru()?node.dataset.ru:node.dataset.en;if(value!==undefined&&node.textContent!==value)node.textContent=value;}if(toolsButton)toolsButton.setAttribute('aria-label',ru()?'Навигация и настройки':'Navigation and settings');nav.setAttribute('aria-label',ru()?'Основная навигация':'Main navigation');const hours=document.querySelector('#statHours');if(hours)hours.title=ru()?'Оценка по отмеченным сериям и известной длительности, не замер времени в плеере':'Estimate from marked episodes and available runtimes, not a player timer';markNavigation();themeSync();}
new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
let refreshTimer;function refresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{themeSync();if(typeof window.avRefreshView==='function')window.avRefreshView();labels();},120);}
addEventListener('storage',e=>{if(e.key==='animeVoidTheme'||e.key==='animeVoidLanguage'||/^watched_|^duration_|^animeVoid(?:Statuses|Favorites|Ratings|ListItems|LastWatch)$/.test(e.key||''))refresh();});addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
for(const b of document.querySelectorAll('#updatesLang'))b.onclick=()=>{const lang=ru()?'en':'ru';try{localStorage.setItem('animeVoidLanguage',lang);}catch(e){}document.documentElement.lang=lang;b.textContent=lang==='ru'?'EN':'RU';};
if(location.pathname.endsWith('/updates.html')){document.documentElement.lang=read('animeVoidLanguage','ru')==='en'?'en':'ru';document.getElementById('updatesLang').textContent=ru()?'EN':'RU';}
labels();
})();

/* Bound the existing suggestions; do not clone results or change search/progress. */
(()=>{'use strict';const input=document.getElementById('search'),box=document.getElementById('searchSuggestions');if(!input||!box)return;const small=matchMedia('(max-width:760px)');let frame=0;
input.setAttribute('aria-controls',box.id);
function clearPosition(){for(const key of ['position','left','top','right','width','maxHeight'])box.style[key]='';}
function position(){frame=0;const open=!box.hidden&&!!input.value.trim();input.setAttribute('aria-expanded',String(open));const mobileOpen=small.matches&&open;if(document.body.classList.contains('av-search-open')!==mobileOpen)document.body.classList.toggle('av-search-open',mobileOpen);if(!mobileOpen){clearPosition();return;}
 const r=input.getBoundingClientRect(),v=window.visualViewport;const viewLeft=v?.offsetLeft||0,viewTop=v?.offsetTop||0,viewWidth=v?.width||innerWidth,viewHeight=v?.height||innerHeight;
 const width=Math.max(1,Math.min(r.width,viewWidth-24)),left=Math.max(viewLeft+12,Math.min(r.left,viewLeft+viewWidth-width-12)),top=r.bottom+8;
 const available=viewTop+viewHeight-top-12;
 box.style.position='fixed';box.style.left=left+'px';box.style.top=top+'px';box.style.right='auto';box.style.width=width+'px';box.style.maxHeight=Math.max(1,Math.min(420,available))+'px';
}
function schedule(){if(!frame)frame=requestAnimationFrame(position);}
new MutationObserver(schedule).observe(box,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
input.addEventListener('input',()=>{box.scrollTop=0;schedule();});
input.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key))return;requestAnimationFrame(()=>{const active=box.querySelector('.search-suggestion.active');if(!active)return;const r=active.getBoundingClientRect(),b=box.getBoundingClientRect();if(r.top<b.top)box.scrollTop-=b.top-r.top+6;else if(r.bottom>b.bottom)box.scrollTop+=r.bottom-b.bottom+6;});});input.addEventListener('focus',schedule);input.addEventListener('blur',schedule);addEventListener('resize',schedule);addEventListener('scroll',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);small.addEventListener('change',schedule);
if(window.ResizeObserver)new ResizeObserver(schedule).observe(document.querySelector('header'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden){box.hidden=true;schedule();}});schedule();
})();

/* 16.3.1: one original backdrop only; no duplicated side or mobile posters. */
(()=>{'use strict';
const bg=document.getElementById('pageBg');if(!bg)return;
document.body.classList.add('av-detail');
document.querySelectorAll('#avTitleArt,.av-anime-mobile-banner').forEach(el=>el.remove());
let signature='',ticket=0,pending=false;
function sync(){
 pending=false;
 const poster=document.querySelector('.anime-page .poster img');
 const match=/url\(["']?(.*?)["']?\)/.exec(bg.style.backgroundImage||'');
 const primary=window.AVSafe?.url(match?.[1]||'')||'',fallback=window.AVSafe?.url(poster?.getAttribute('src')||'')||'';
 const key=primary+'|'+fallback;if((!primary&&!fallback)||key===signature)return;signature=key;const version=++ticket;
 const candidates=[...new Set([primary,fallback].filter(Boolean))];
 function load(index){
  if(index>=candidates.length)return;
  const src=candidates[index],probe=new Image();let settled=false;
  const timer=setTimeout(()=>{if(settled)return;settled=true;if(version===ticket)load(index+1);},8000);
  probe.onload=()=>{if(settled)return;settled=true;clearTimeout(timer);if(version!==ticket)return;if(index>0){bg.style.backgroundImage='url('+JSON.stringify(src)+')';bg.classList.add('bg-blurred');}};
  probe.onerror=()=>{if(settled)return;settled=true;clearTimeout(timer);if(version===ticket)load(index+1);};probe.src=src;
 }
 load(0);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(sync);}}
new MutationObserver(schedule).observe(bg,{attributes:true,attributeFilter:['style','class']});
const main=document.querySelector('main');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});schedule();
})();
