/* ANIME VOID 69.0 — original file download affordance.
   No video scraping, DRM circumvention, capture, proxying or transcoding. */
(()=>{
 'use strict';
 const policy=window.AVDownloadPolicy69;
 const player=document.getElementById('avPlayer');
 if(!policy||!player||!document.body?.classList.contains('av-watch-page'))return;
 if(document.getElementById('av69Downloads'))return;
 const ru=()=>document.documentElement.lang!=='en';
 const tr=(a,b)=>ru()?a:b;
 const element=(tag,cls,text)=>{
   const e=document.createElement(tag);
   if(cls)e.className=cls;
   if(text!==undefined)e.textContent=String(text);
   return e;
 };
 const panel=element('section','av69-download-panel');
 panel.id='av69Downloads';
 const heading=element('div','av69-download-heading');
 const badge=element('span','av69-kicker','ANIME VOID / ORIGINAL FILE');
 const title=element('h2','',tr('Скачать серию в исходном качестве','Download original-quality episode'));
 const details=element('p','av69-download-description');
 heading.append(badge,title,details);
 const link=element('a','av69-download-button');
 link.id='av69DownloadLink';
 link.rel='noopener noreferrer';
 link.target='_blank';
 const note=element('p','av69-download-note');
 note.id='av69DownloadNote';
 note.setAttribute('role','status');
 panel.append(heading,link,note);
 const anchor=document.getElementById('avWatch57Nav')||player;
 anchor.insertAdjacentElement('afterend',panel);
 function state(){
   const params=new URLSearchParams(location.search);
   const media=window.AVPlayer?.state?.()||{};
   const anime=params.get('id');
   const episode=Number(media.episode??params.get('episode')??1);
   const chosenSource=media.source||params.get('source')||'';
   return policy.resolve(window.AVVideoSources?.sources||[],anime,episode,chosenSource,location.href);
 }
 function update(){
   const file=state();
   panel.setAttribute('aria-label',tr('Загрузка исходной серии','Download original episode'));
   title.textContent=tr('Скачать серию в исходном качестве','Download original-quality episode');
   if(file){
     link.hidden=false;
     link.href=file.href;
     if(file.sameOrigin)link.download=file.filename;
     else link.removeAttribute('download');
     link.textContent=tr('↓ Скачать оригинал · ','↓ Download original · ')+file.format.toUpperCase();
     details.textContent=tr('Серия '+file.episode+' · исходный файл от источника без перекодирования.',
       'Episode '+file.episode+' · source-provided original file with no transcoding.');
     note.textContent=file.sameOrigin
       ?tr('Ссылка ведёт непосредственно на исходный файл.','The link points directly to the original file.')
       :tr('Внешний сервер может открыть файл в новой вкладке. Загрузка зависит от его настроек.',
          'The provider may open the file in a new tab. Download depends on the server configuration.');
   }else{
     link.hidden=true;
     link.removeAttribute('href');
     link.removeAttribute('download');
     details.textContent=tr('Загрузка доступна только при разрешении правообладателя и наличии исходного файла.',
       'Downloading requires the copyright holder\'s permission and an original source file.');
     note.textContent=tr(
       'Разрешённый оригинал этой серии пока не подключён. ANIME VOID не извлекает видео из внешнего плеера Kodik.',
       'No authorized original file is configured for this episode. ANIME VOID does not extract video from the Kodik player.'
     );
   }
 }
 const subtitle=document.getElementById('episodeTitle');
 if(subtitle)new MutationObserver(update).observe(subtitle,{childList:true,characterData:true,subtree:true});
 new MutationObserver(update).observe(player,{childList:true});
 player.addEventListener('change',()=>queueMicrotask(update));
 addEventListener('pageshow',update);
 addEventListener('popstate',update);
 let lastLang=document.documentElement.lang;
 new MutationObserver(()=>{
   if(lastLang!==document.documentElement.lang){lastLang=document.documentElement.lang;update();}
 }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 update();
})();