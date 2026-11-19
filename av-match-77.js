/* ANIME VOID V77 — private local Anime Match; no account access, no remote persistence. */
(() => {
 'use strict';
 const core=window.AVMatch77,$=id=>document.getElementById(id);
 if(!core||!$('matchGenresA')||!$('matchGenresB'))return;
 const labels={
  Romance:['Романтика','Romance'],Fantasy:['Фэнтези','Fantasy'],Action:['Экшен','Action'],
  Comedy:['Комедия','Comedy'],Drama:['Драма','Drama'],Mystery:['Тайны','Mystery'],
  Adventure:['Приключения','Adventure'],'Slice of Life':['Повседневность','Slice of life'],
  'Sci-Fi':['Фантастика','Sci-Fi']
 };
 function lang(){try{return localStorage.getItem('animeVoidLanguage')==='en'?'en':'ru';}catch{return 'ru';}}
 const t=(ru,en)=>lang()==='ru'?ru:en;
 let prefs={a:[],b:[]},busy=false,lastResult=[],source='';
 const params=core.parsePrefs(location.search);prefs={a:params.a,b:params.b};
 if(!prefs.a.length&&!prefs.b.length){prefs.a=['Romance'];prefs.b=['Comedy'];}
 const {a,b}=prefs;
 const genres={a:$('matchGenresA'),b:$('matchGenresB')};
 function create(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=String(text);
  return el;
 }
 function updateCopy(){
  document.documentElement.lang=lang();
  for(const node of document.querySelectorAll('.av77-copy[data-ru][data-en]')){
   // Intro headline deliberately carries a controlled inline <em> element.
   if(node.tagName==='H1'){
    const [before,after]=t('Два вкуса.|Одна история.','Two tastes.|One story.').split('|');
    node.replaceChildren(document.createTextNode(before+' '),create('em','',after));
   }else node.textContent=lang()==='ru'?node.dataset.ru:node.dataset.en;
  }
  $('matchLanguage').textContent=lang()==='ru'?'EN':'RU';
  $('matchLanguage').setAttribute('aria-label',t('Переключить на английский','Switch to Russian'));
  renderChoices();updateCount();
  if(lastResult.length)renderResults(lastResult,source);
 }
 function updateCount(){
  $('matchCount').textContent=t('Выбрано: '+a.length+' + '+b.length+' жанров','Selected: '+a.length+' + '+b.length+' genres');
  $('matchFind').disabled=!a.length||!b.length||busy;
  $('matchShare').disabled=!a.length||!b.length;
 }
 function renderChoices(){
  for(const side of ['a','b']){
   const list=genres[side];list.replaceChildren();
   list.setAttribute('aria-label',side==='a'?t('Жанры первого зрителя','Viewer one genres'):t('Жанры второго зрителя','Viewer two genres'));
   for(const genre of core.GENRES){
    const chosen=prefs[side].includes(genre);
    const button=create('button','av77-chip',labels[genre][lang()==='ru'?0:1]);
    button.type='button';button.dataset.genre=genre;
    button.setAttribute('aria-pressed',String(chosen));
    button.disabled=!chosen&&prefs[side].length>=3;
    button.addEventListener('click',()=>{
     if(chosen)prefs[side]=prefs[side].filter(x=>x!==genre);
     else if(prefs[side].length<3)prefs[side]=[...prefs[side],genre];
     renderChoices();updateCount();
     // Existing matches are no longer for these selections.
     lastResult=[];$('matchResults').hidden=true;
     history.replaceState(null,'',location.pathname+'?'+core.buildParams(prefs.a,prefs.b));
    });
    list.append(button);
   }
  }
 }
 function status(message,error=false){
  const label=$('matchStatus');
  label.hidden=!message;label.textContent=message;label.dataset.error=String(error);
 }
 function cachedCatalog(){
  try{
   const raw=localStorage.getItem('animeVoidCatalog');
   if(!raw||raw.length>2e6)return [];
   const parsed=JSON.parse(raw);
   return Array.isArray(parsed)?parsed.slice(0,800):[];
  }catch{return [];}
 }
 function safeCover(link){
  if(typeof link!=='string')return null;
  try{
   const url=new URL(link,location.href);
   if(url.protocol==='https:'&&(url.hostname==='s4.anilist.co'||url.hostname==='s3.anilist.co'||url.hostname==='animevoid.ru'))return url.href;
   if(url.origin===location.origin&&url.pathname.endsWith('.webp')||url.origin===location.origin&&url.pathname.endsWith('.jpg'))return url.href;
  }catch{}
  return null;
 }
 async function onlineCatalog(picks){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9500);
  const query='query($genres:[String]){Page(page:1,perPage:50){media(type:ANIME,isAdult:false,genre_in:$genres,sort:SCORE_DESC){id isAdult title{english romaji} genres averageScore seasonYear coverImage{large}}}}';
  try{
   const response=await fetch('https://graphql.anilist.co',{
    method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({query,variables:{genres:picks}}),signal:controller.signal
   });
   if(!response.ok)throw Error('AniList HTTP '+response.status);
   const data=await response.json();
   if(data.errors?.length||!Array.isArray(data.data?.Page?.media))throw Error('AniList response unavailable');
   return data.data.Page.media;
  }finally{clearTimeout(timeout);}
 }
 function renderResults(items,from){
  const section=$('matchResults'),grid=$('matchGrid');
  section.hidden=false;grid.replaceChildren();
  $('matchSource').textContent=from==='online'?t('AniList · актуальные данные','AniList · live catalog'):
   t('Сохранённый каталог · офлайн','Saved catalog · offline');
  if(!items.length){
   const empty=create('p','av77-status',t('По этим жанрам совпадений не нашлось. Попробуйте сменить один жанр.','No matches for these genres. Try changing one of the genres.'));
   grid.append(empty);return;
  }
  const available=new Set((window.AVVideoSources?.sources||[]).map(x=>x.animeId));
  for(const item of items){
   const article=create('article','av77-card');
   const poster=create('div','av77-poster');
   const imgLink=safeCover(item.cover);
   if(imgLink){
    const img=create('img');img.src=imgLink;img.alt='';img.loading='lazy';img.decoding='async';
    img.onerror=()=>{img.remove();img.onerror=null;};poster.append(img);
   }
   if(item.score){const score=create('span','av77-score','★ '+item.score);poster.append(score);}
   const contents=create('div','av77-card-copy');
   contents.append(create('h3','',item.title));
   const meta=create('div','av77-card-sub');
   meta.append(create('span','',item.year||t('Аниме','Anime')),
    create('span','',t('Обоим подходит','Shared taste')));
   contents.append(meta);
   contents.append(create('div','av77-card-genres',item.genres.filter(x=>core.GENRES.includes(x)).slice(0,3).map(g=>labels[g]?.[lang()==='ru'?0:1]||g).join(' · ')));
   const links=create('div','av77-card-links'),details=create('a','',t('Подробнее ↗','Details ↗'));
   details.href='anime.html?id='+encodeURIComponent(item.id);
   links.append(details);
   if(available.has('anilist-'+item.id)){
    const room=create('a','',t('▶ Смотреть вдвоём','▶ Watch together'));
    room.href='party.html?anime='+encodeURIComponent(item.id);links.append(room);
   }
   contents.append(links);article.append(poster,contents);grid.append(article);
  }
 }
 async function find(){
  if(busy||!a.length||!b.length)return;
  busy=true;updateCount();lastResult=[];$('matchResults').hidden=true;
  status(t('Ищем истории по вашим общим интересам…','Finding stories that fit both tastes…'));
  try{
   let data=[],from='online';
   try{data=await onlineCatalog([...new Set([...a,...b])]);}
   catch(e){from='offline';data=cachedCatalog();}
   const results=core.rank(data,a,b,12);
   lastResult=results;source=from;
   if(!results.length&&from==='offline')status(t('Нет связи с AniList, а в локальном каталоге не хватает подходящих тайтлов. Открой каталог сайта и повтори.','AniList is unavailable and the saved catalog has no suitable titles. Visit the main catalog and retry.'),true);
   else status(from==='offline'?t('Показаны совпадения из сохранённого каталога.','Showing saved catalog matches.'):t('Готово — подбор основан на пересечении жанров.','Done — ranked by shared genres.'));
   renderResults(results,from);
  }catch(e){status(t('Не удалось получить подборку. Попробуй ещё раз.','Could not load picks. Try again.'),true);}
  finally{busy=false;updateCount();}
 }
 async function share(){
  const url=new URL(location.href);url.search=core.buildParams(a,b);url.hash='';
  const link=url.toString();
  try{
   if(navigator.share){await navigator.share({title:'Anime Match · ANIME VOID',url:link});return;}
   if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link);status(t('Ссылка скопирована.','Link copied.'));return;}
  }catch(e){if(e.name==='AbortError')return;}
  // Fallback is visible and selectable; never pretend the copy succeeded.
  const box=create('input','av77-share-fallback');
  box.value=link;box.readOnly=true;box.setAttribute('aria-label',t('Ссылка для копирования','Link to copy'));
  box.style.cssText='width:100%;min-height:44px;background:#231631;color:#fff;border:1px solid #9f6ee0;padding:12px;border-radius:10px;margin-top:10px';
  const target=$('matchStatus');target.hidden=false;target.dataset.error='false';
  target.replaceChildren(document.createTextNode(t('Выдели и скопируй ссылку:','Select and copy the link:')),box);
  box.focus();box.select();
 }
 $('matchFind').addEventListener('click',find);
 $('matchShare').addEventListener('click',()=>void share());
 $('matchLanguage').addEventListener('click',()=>{
  try{localStorage.setItem('animeVoidLanguage',lang()==='ru'?'en':'ru');}catch{}
  // Language remains functional even if storage is blocked.
  updateCopy();
 });
 addEventListener('storage',event=>{if(event.key==='animeVoidLanguage')updateCopy();});
 updateCopy();
})();
