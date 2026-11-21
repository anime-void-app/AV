/* ANIME VOID V85 — home editorial navigation. Progressive enhancement only.
   No video, progress, auth, purchase or cloud-state writes. */
(()=>{
 'use strict';
 const ready=()=>{
  document.body?.classList.add('av85-ready');
  if(!document.body?.classList.contains('av-home'))return;
  const hero=document.querySelector('main .hero');
  if(!hero || document.querySelector('.av85-journey'))return;
  const ru=()=>document.documentElement.lang!=='en';
  const make=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e};
  const dictionaries={
   ru:{
    heroKicker:'ТВОЯ ИСТОРИЯ · 01',heroTitle:'Всегда есть что открыть.',
    heroCopy:'Возвращайся к любимым сериям, собирай коллекции и создавай свой аниме-мир.',
    heroAction:'Продолжить просмотр',
    eyebrow:'ANIME VOID / НАВИГАЦИЯ',title:'Выбирай свой маршрут',
    hint:'Всё важное — в одном месте.',
    cards:[
     ['◷','Продолжить','История и просмотренные серии'],
     ['✦','Исследовать','Тайтлы, жанры и подборки'],
     ['◇','Мастерская','Профиль, оформление и коллекции'],
     ['↗','На телефон','ANIME VOID как приложение']
    ]
   },
   en:{
    heroKicker:'YOUR STORY · 01',heroTitle:'Always something to discover.',
    heroCopy:'Return to your favorite episodes, collect stories and shape your own anime space.',
    heroAction:'Continue watching',
    eyebrow:'ANIME VOID / NAVIGATION',title:'Choose your own path',
    hint:'Everything that matters, in one place.',
    cards:[
     ['◷','Keep watching','History and watched episodes'],
     ['✦','Explore','Titles, genres and discoveries'],
     ['◇','Profile studio','Your style and collections'],
     ['↗','On your phone','ANIME VOID as an app']
    ]
   }
  };
  // Replace the old joint-themed hero promo with an independent personal-space panel.
  const old=hero.querySelector('.av77-hero-match');
  const side=make('aside','av85-hero-side');
  side.setAttribute('aria-label','ANIME VOID discovery');
  const orbit=make('span','av85-orb');orbit.setAttribute('aria-hidden','true');orbit.textContent='☾';
  const kicker=make('span','av85-side-kicker');
  const title=make('strong');
  const copy=make('p');
  const action=make('a');action.href='history.html';
  side.append(orbit,kicker,title,copy,action);
  // Keep the existing PWA install button and its event listeners intact.
  const install=old?.querySelector('#av77Install');
  if(install){install.classList.add('av85-install');side.append(install)}
  if(old)old.replaceWith(side);else hero.append(side);

  const journey=make('section','av85-journey');journey.id='av85Journey';
  journey.setAttribute('aria-label','Discover ANIME VOID');
  const head=make('div','av85-journey-head');
  const heading=make('div');
  const eyebrow=make('span','av85-journey-eyebrow'),h2=make('h2');
  heading.append(eyebrow,h2);
  const note=make('p');
  head.append(heading,note);
  const grid=make('div','av85-journey-grid');
  const targets=['history.html','explore.html','profile.html#profileWorkshop','app.html'];
  const cardRefs=targets.map(href=>{
   const a=make('a','av85-journey-card');a.href=href;
   const glyph=make('span','av85-card-icon');
   const name=make('span','av85-card-heading');
   const small=make('span','av85-card-note');
   a.append(glyph,name,small);grid.append(a);
   return {glyph,name,small};
  });
  journey.append(head,grid);
  hero.insertAdjacentElement('afterend',journey);
  function render(){
   const t=dictionaries[ru()?'ru':'en'];
   kicker.textContent=t.heroKicker;title.textContent=t.heroTitle;copy.textContent=t.heroCopy;
   action.textContent=t.heroAction;
   eyebrow.textContent=t.eyebrow;h2.textContent=t.title;note.textContent=t.hint;
   cardRefs.forEach((c,i)=>{
    const row=t.cards[i];c.glyph.textContent=row[0];c.name.textContent=row[1];c.small.textContent=row[2];
   });
  }
  render();
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();