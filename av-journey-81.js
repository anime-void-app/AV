/* ANIME VOID V81: responsive journey UI. Read-only; old rewards and purchased cosmetics stay untouched. */
(() => {
  'use strict';
  if (window.__AVJourney81) return;
  window.__AVJourney81 = true;
  const $ = (selector, root=document) => root.querySelector(selector);
  const el = (tag, className, value) => {
    const n=document.createElement(tag);
    if(className)n.className=className;
    if(value!==undefined)n.textContent=value;
    return n;
  };
  const ru = () => document.documentElement.lang !== 'en';
  const text = (r,e) => ru()?r:e;
  const steps = [
    {hours:0,icon:'✦',ru:'Искра',en:'Spark'},
    {hours:2,icon:'🌙',ru:'Странник',en:'Wanderer'},
    {hours:10,icon:'🌸',ru:'Хранитель историй',en:'Story Keeper'},
    {hours:30,icon:'⚔️',ru:'Мастер миров',en:'Worldwalker'},
    {hours:75,icon:'💠',ru:'Звёздный архивариус',en:'Star Archivist'},
    {hours:150,icon:'👑',ru:'Повелитель историй',en:'Story Sovereign'},
    {hours:300,icon:'✧',ru:'Легенда Бездны',en:'Void Legend'}
  ];
  const emblems = [
    {icon:'🎞️',ru:'Первая история',en:'First Story',descriptionRu:'1 полностью просмотренная серия',descriptionEn:'1 verified episode',check:m=>m.completed>=1},
    {icon:'🌠',ru:'Ночной марафон',en:'Night Marathon',descriptionRu:'2 часа фактического просмотра',descriptionEn:'2 hours of verified playback',check:m=>m.seconds>=7200},
    {icon:'📚',ru:'Коллекционер',en:'Collector',descriptionRu:'5 разных тайтлов',descriptionEn:'5 different titles',check:m=>m.titles>=5},
    {icon:'🔥',ru:'Десятая глава',en:'Tenth Chapter',descriptionRu:'10 просмотренных серий',descriptionEn:'10 completed episodes',check:m=>m.completed>=10},
    {icon:'🌌',ru:'За гранью',en:'Beyond the Veil',descriptionRu:'30 часов фактического просмотра',descriptionEn:'30 hours of verified playback',check:m=>m.seconds>=108000},
    {icon:'👑',ru:'Легенда',en:'Legend',descriptionRu:'100 просмотренных серий',descriptionEn:'100 completed episodes',check:m=>m.completed>=100}
  ];
  function measured() {
    try {
      const L=window.AVWatchLedger;
      if(!L?.presentation)return {seconds:0,completed:0,titles:0,units:0,available:false};
      const raw=localStorage.getItem(L.KEY);
      const v=L.presentation(raw?JSON.parse(raw):{version:1,entries:{}});
      return {seconds:v.seconds,completed:v.completed,titles:v.titles,units:v.units,available:true};
    }catch{return {seconds:0,completed:0,titles:0,units:0,available:false};}
  }
  function formatSeconds(s){
    const total=Math.max(0,Math.floor(s/60)),h=Math.floor(total/60),m=total%60;
    return h?text(h+' ч '+m+' мин',h+' h '+m+' min'):text(m+' мин',m+' min');
  }
  function rankFor(hours){
    let index=0;
    for(let i=1;i<steps.length;i++)if(hours>=steps[i].hours)index=i;
    return {rank:steps[index],next:steps[index+1]||null,index};
  }
  function link(href,icon,titleRu,titleEn,detailRu,detailEn){
    const a=el('a','av81-tile');a.href=href;
    a.append(el('span','av81-tile-icon',icon));
    const copy=el('span','av81-tile-copy');
    const strong=el('strong');strong.dataset.ru=titleRu;strong.dataset.en=titleEn;
    const small=el('small');small.dataset.ru=detailRu;small.dataset.en=detailEn;
    copy.append(strong,small);a.append(copy,el('span','av81-tile-arrow','↗'));
    return a;
  }
  let heroCard=null,passport=null,info=null,rankBar=null,rankLabel=null,rankNext=null,emblemList=null,watchNote=null;
  function setupHome(){
    const hero=$('body.av-home .hero');
    if(!hero||$('#av81Hero'))return;
    heroCard=el('aside','av81-hero-panel');heroCard.id='av81Hero';
    const top=el('div','av81-hero-top');
    const kicker=el('span','av81-eyebrow');kicker.dataset.ru='ТВОЯ КИНОВСЕЛЕННАЯ';kicker.dataset.en='YOUR CINEMA UNIVERSE';
    top.append(kicker,el('span','av81-live-dot','✦'));
    const h=el('h2','av81-hero-rank');h.id='av81HomeRank';
    const desc=el('p','av81-hero-copy');desc.dataset.ru='Каждая история оставляет след. Смотри и открывай новые горизонты.';desc.dataset.en='Every story leaves a mark. Watch and explore new horizons.';
    const numbers=el('div','av81-hero-numbers');
    for(const [id,labelRu,labelEn] of [['av81HomeHours','Просмотрено','Watch time'],['av81HomeEpisodes','Серий','Episodes']]){
      const metric=el('div','av81-number');const value=el('strong');value.id=id;
      const lbl=el('span');lbl.dataset.ru=labelRu;lbl.dataset.en=labelEn;
      metric.append(value,lbl);numbers.append(metric);
    }
    const action=el('a','av81-primary');action.href='profile.html';action.dataset.ru='Мой путь зрителя ↗';action.dataset.en='My viewer journey ↗';
    heroCard.append(top,h,desc,numbers,action);
    hero.append(heroCard);
    const menu=el('section','av81-explore');menu.id='av81Explore';
    const header=el('div','av81-explore-head');
    const title=el('h2');title.dataset.ru='Твоя следующая история';title.dataset.en='Your next story';
    const sub=el('p');sub.dataset.ru='Быстрый доступ к самому интересному';sub.dataset.en='Jump into what matters';
    header.append(title,sub);menu.append(header);
    const tiles=el('div','av81-tile-grid');
    tiles.append(
      link('index.html#catalog','⌕','Выбрать аниме','Explore anime','Каталог и поиск по жанрам','Catalog and genre search'),
      link('history.html','▶','Продолжить просмотр','Continue watching','Вернуться к последней серии','Pick up where you left off'),
      link('collections.html','♡','Мои коллекции','My collections','Сохраняй любимые истории','Save your favorite stories')
    );
    menu.append(tiles);hero.after(menu);
  }
  function setupProfile(){
    const root=$('body.av-profile-page #profileOverview');
    if(!root||$('#av81Passport'))return;
    passport=el('section','av81-passport');passport.id='av81Passport';
    passport.setAttribute('aria-labelledby','av81PassportTitle');
    const top=el('div','av81-passport-heading');
    const intro=el('div');
    const eyebrow=el('span','av81-eyebrow');eyebrow.dataset.ru='ПУТЬ ЗРИТЕЛЯ';eyebrow.dataset.en='VIEWER JOURNEY';
    const heading=el('h2');heading.id='av81PassportTitle';heading.dataset.ru='Твой киноранг';heading.dataset.en='Your cinema rank';
    intro.append(eyebrow,heading);
    const badge=el('span','av81-passport-badge');badge.dataset.ru='По реальному просмотру';badge.dataset.en='Based on verified playback';
    top.append(intro,badge);
    const content=el('div','av81-rank-layout');
    const symbol=el('div','av81-rank-symbol');symbol.id='av81RankSymbol';symbol.setAttribute('aria-hidden','true');
    info=el('div','av81-rank-info');
    rankLabel=el('h3');rankLabel.id='av81RankName';
    const count=el('p');count.id='av81RankTime';
    rankBar=el('progress','av81-rank-progress');rankBar.max=100;rankBar.value=0;
    rankBar.setAttribute('aria-label',text('Прогресс следующего киноранга','Progress toward next cinema rank'));
    rankNext=el('small');rankNext.id='av81RankNext';
    info.append(rankLabel,count,rankBar,rankNext);
    content.append(symbol,info);
    const badgesIntro=el('div','av81-medals-heading');
    const medalTitle=el('h3');medalTitle.dataset.ru='Новые значки пути';medalTitle.dataset.en='New journey emblems';
    const medalSub=el('span');medalSub.id='av81MedalCounter';
    badgesIntro.append(medalTitle,medalSub);
    emblemList=el('div','av81-medal-grid');
    emblems.forEach((b,i)=>{
      const card=el('article','av81-medal');card.dataset.index=String(i);card.setAttribute('aria-label',b.ru);
      const icon=el('span','av81-medal-icon',b.icon);
      const body=el('div'),name=el('strong'),desc=el('small');
      name.dataset.ru=b.ru;name.dataset.en=b.en;
      desc.dataset.ru=b.descriptionRu;desc.dataset.en=b.descriptionEn;
      body.append(name,desc);card.append(icon,body);
      emblemList.append(card);
    });
    const note=el('p','av81-passport-note');
    note.dataset.ru='Киноранг и значки — новая визуальная шкала. Старые уровни, достижения, покупки и бонусы сохранены. Перемотка не начисляет часы.';
    note.dataset.en='Cinema ranks and emblems are visual milestones. Existing levels, achievements, purchases and bonuses stay unchanged. Seeking does not earn watch time.';
    passport.append(top,content,badgesIntro,emblemList,note);
    root.after(passport);
  }
  function setupWatch(){
    if(!document.body.classList.contains('av-watch-page')||document.body.classList.contains('av-party-embed')||$('#av81WatchHint'))return;
    const top=$('.watch-top');if(!top)return;
    watchNote=el('p','av81-watch-hint');watchNote.id='av81WatchHint';
    watchNote.dataset.ru='✓ Серия отмечается автоматически после подтверждённого просмотра большей части видео. Простая перемотка не засчитывается.';
    watchNote.dataset.en='✓ Episodes are marked automatically after most of the video has been verifiably watched. Skipping does not count.';
    top.append(watchNote);
  }
  function translate(){
    document.querySelectorAll('[data-ru][data-en]').forEach(n=>{
      if(n.closest('#av81Hero,#av81Explore,#av81Passport,#av81WatchHint'))n.textContent=ru()?n.dataset.ru:n.dataset.en;
    });
    if(rankBar)rankBar.setAttribute('aria-label',text('Прогресс следующего киноранга','Progress toward next cinema rank'));
  }
  function update(){
    const m=measured(),hours=m.seconds/3600,{rank,next,index}=rankFor(hours);
    if(heroCard){
      $('#av81HomeRank').textContent=rank.icon+' '+text(rank.ru,rank.en);
      $('#av81HomeHours').textContent=m.available?formatSeconds(m.seconds):'—';
      $('#av81HomeEpisodes').textContent=m.available?String(m.completed):'—';
    }
    if(passport){
      $('#av81RankSymbol').textContent=rank.icon;
      rankLabel.textContent=text(rank.ru,rank.en);
      $('#av81RankTime').textContent=text('Подтверждено: ','Verified: ')+(m.available?formatSeconds(m.seconds):'—');
      const from=rank.hours,to=next?.hours||rank.hours;
      rankBar.value=next?Math.max(0,Math.min(100,Math.floor((hours-from)/(to-from)*100))):100;
      rankNext.textContent=!m.available?text('Не удалось прочитать данные. Хранилище не изменено.','Could not read watch data. Nothing was changed.'):
        next?text('До ранга «'+next.ru+'»: '+formatSeconds(Math.max(0,(to-hours)*3600)),'Until '+next.en+': '+formatSeconds(Math.max(0,(to-hours)*3600))):
          text('Максимальный киноранг достигнут','Maximum cinema rank achieved');
      let unlocked=0;
      emblemList.querySelectorAll('.av81-medal').forEach((card,i)=>{
        const earned=m.available&&emblems[i].check(m);
        if(earned)unlocked++;
        card.classList.toggle('is-earned',earned);
        card.classList.toggle('is-locked',!earned);
        card.setAttribute('aria-label',text(emblems[i].ru,emblems[i].en)+' · '+text(earned?'открыто':'ещё не открыто',earned?'unlocked':'locked'));
      });
      $('#av81MedalCounter').textContent=unlocked+' / '+emblems.length;
      passport.dataset.tier=String(index);
    }
  }
  function init(){
    setupHome();setupProfile();setupWatch();
    translate();update();
    addEventListener('av:measured',update);
    addEventListener('av:progress',update);
    addEventListener('av:account-state',update);
    addEventListener('av:state',update);
    addEventListener('pageshow',update);
    addEventListener('focus',update);
    addEventListener('storage',event=>{if(!event.key||event.key==='animeVoidMeasuredV1')update();});
    new MutationObserver(()=>{translate();update();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();