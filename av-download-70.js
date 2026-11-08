/* ANIME VOID 70.0 — original, licensed video file options and sizes.
   The browser receives provider files directly. No relaying, scraping or transcoding. */
(()=>{
 'use strict';
 const policy=window.AVDownloadPolicy70;
 const player=document.getElementById('avPlayer');
 if(!policy||!player||!document.body?.classList.contains('av-watch-page'))return;
 if(document.getElementById('av70Downloads'))return;
 const ru=()=>document.documentElement.lang!=='en';
 const t=(a,b)=>ru()?a:b;
 const el=(tag,cls,text)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=String(text);
  return e;
 };
 let manifest=[],loading=true,loadError=false,files=[],selectedURL='';
 const section=el('section','av70-download-panel');section.id='av70Downloads';
 const intro=el('div','av70-intro');
 const kicker=el('span','av70-kicker','ANIME VOID / DOWNLOADS');
 const title=el('h2');
 const subtitle=el('p','av70-description');
 intro.append(kicker,title,subtitle);
 const action=el('div','av70-actions');
 const label=el('label','av70-choice-label');label.htmlFor='av70Variant';
 const select=el('select','av70-select');select.id='av70Variant';
 const go=el('a','av70-download-button');go.id='av70DownloadButton';
 go.rel='noopener noreferrer';go.referrerPolicy='no-referrer';
 go.target='_blank';
 action.append(label,select,go);
 const info=el('div','av70-info');
 const size=el('strong','av70-size');
 const source=el('span','av70-source');
 const note=el('p','av70-note');
 note.setAttribute('role','status');
 info.append(size,source,note);
 section.append(intro,action,info);
 const after=document.getElementById('avWatch57Nav')||player;
 after.insertAdjacentElement('afterend',section);
 function current(){
  const q=new URLSearchParams(location.search);
  const state=window.AVPlayer?.state?.()||{};
  const n=Number(state.episode??q.get('episode')??1);
  return {anime:q.get('id'),episode:n,source:state.source||q.get('source')||''};
 }
 function selection(){
  const c=current();
  const sources=[...(Array.isArray(window.AVVideoSources?.sources)?window.AVVideoSources.sources:[]),...manifest];
  return policy.list(sources,c.anime,c.episode,c.source,location.href);
 }
 function currentFile(){return files[Number(select.value)]||null;}
 function applyFile(){
  const file=currentFile();
  if(!file){go.hidden=true;go.removeAttribute('href');go.removeAttribute('download');return;}
  go.hidden=false;go.href=file.href;
  if(file.sameOrigin)go.download=file.filename;
  else go.removeAttribute('download');
  selectedURL=file.href;
  go.textContent=file.original?t('↓ Скачать оригинал','↓ Download original'):
    t('↓ Скачать выбранный файл','↓ Get selected file');
  size.textContent=policy.formatSize(file.bytes,ru()?'ru':'en');
  source.textContent=file.format.toUpperCase()+' · '+(file.original?t('Оригинал','Original'):file.quality)+' · '+file.sourceName;
  note.textContent=file.sameOrigin
   ?t('Прямая загрузка файла в исходном виде. Фактический размер зависит от сервера.',
      'Direct original file link. Actual file size is controlled by the provider.')
   :t('Файл находится на внешнем сервере: он может открыться в новой вкладке. Для скачивания сервер должен разрешать выдачу файла.',
      'This file is on an external server and may open in a new tab. Download depends on its response headers.');
 }
 function render(){
  const c=current(),previous=selectedURL;
  files=selection();
  select.replaceChildren();
  title.textContent=t('Скачать серию','Download episode');
  section.setAttribute('aria-label',t('Скачивание разрешённых оригинальных файлов','Authorized original-file downloads'));
  label.textContent=t('Формат и качество','Format & quality');
  if(!files.length){
   select.disabled=true;
   const missing=el('option','',t('Нет доступных файлов','No files available'));
   select.append(missing);
   go.hidden=true;go.removeAttribute('href');go.removeAttribute('download');
   size.textContent='';
   source.textContent='';
   subtitle.textContent=t('Серия '+(Number.isSafeInteger(c.episode)?c.episode:'—')+' · разрешённые исходные файлы',
      'Episode '+(Number.isSafeInteger(c.episode)?c.episode:'—')+' · authorized source files');
   note.textContent=loading?t('Проверяем доступные файлы…','Checking available files…'):
    loadError?t('Каталог файлов недоступен. Повтори попытку позже.','Download catalog unavailable. Try again later.'):
    t('Файлы для скачивания пока не предоставлены правообладателем. Kodik не разрешает скачивание через ANIME VOID.',
      'No rights-cleared files are available. ANIME VOID cannot download episodes from the Kodik player.');
   return;
  }
  select.disabled=false;
  subtitle.textContent=t('Серия '+c.episode+' · '+files.length+' вариант(ов) без перекодирования',
    'Episode '+c.episode+' · '+files.length+' untranscoded option(s)');
  for(const file of files){
   const option=el('option','',(file.original?t('Оригинал','Original'):file.quality.toUpperCase())+
    ' · '+file.format.toUpperCase()+' · '+policy.formatSize(file.bytes,ru()?'ru':'en'));
   option.value=String(select.options.length);
   select.append(option);
  }
  const preferred=files.findIndex(f=>f.href===previous);
  select.value=String(preferred>=0?preferred:0);
  applyFile();
 }
 select.addEventListener('change',applyFile);
 go.addEventListener('click',event=>{if(!currentFile()){event.preventDefault();}});
 const episode=document.getElementById('episodeTitle');
 if(episode)new MutationObserver(render).observe(episode,{childList:true,characterData:true,subtree:true});
 new MutationObserver(render).observe(player,{childList:true});
 player.addEventListener('change',()=>queueMicrotask(render));
 addEventListener('pageshow',render);
 addEventListener('popstate',render);
 let lang=document.documentElement.lang;
 new MutationObserver(()=>{
  if(lang!==document.documentElement.lang){lang=document.documentElement.lang;render();}
 }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 async function loadManifest(){
  try{
   const u=new URL('licensed-downloads.json',location.href);
   if(u.origin!==location.origin)throw Error('Cross-origin catalog');
   const response=await fetch(u.href,{method:'GET',cache:'no-cache',credentials:'same-origin'});
   if(!response.ok)throw Error('Catalog HTTP '+response.status);
   const text=await response.text();
   if(text.length>1000000)throw Error('Catalog too large');
   const data=JSON.parse(text);
   if(data?.version!==1||!Array.isArray(data.sources)||data.sources.length>500)throw Error('Invalid catalog');
   manifest=data.sources;
  }catch(error){
   loadError=true;
   console.warn('ANIME VOID download catalog unavailable:',error);
  }finally{loading=false;render();}
 }
 render();
 void loadManifest();
})();