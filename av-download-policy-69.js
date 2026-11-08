/* ANIME VOID 69.0 — authorized original media file selection.
   Playback access does not imply permission to download. */
(()=>{
 'use strict';
 const idPattern=/^(?:anilist-)?[1-9][0-9]{0,9}$/;
 const formats=new Set(['mp4','mkv','webm','mov','m4v','avi']);
 function identity(raw){
   const id=String(raw||'');
   return idPattern.test(id)?'anilist-'+id.replace(/^anilist-/,''):null;
 }
 function safeUrl(raw,base){
   if(typeof raw!=='string'||!raw.trim()||raw.length>2048)return null;
   try{
     const target=new URL(raw,base),home=new URL(base);
     if(target.username||target.password||target.hash)return null;
     if(target.protocol!=='https:'&&!(target.protocol==='http:'&&target.origin===home.origin))return null;
     return target.href;
   }catch{return null;}
 }
 function filename(raw,animeId,episode,format){
   const fallback='ANIME-VOID-'+animeId.replace('anilist-','')+'-E'+String(episode).padStart(2,'0')+'.'+format;
   if(typeof raw!=='string'||raw.length<3||raw.length>140)return fallback;
   const name=raw.trim();
   if(!/^[a-zA-Z0-9_ ()-]+\.(mp4|mkv|webm|mov|m4v|avi)$/i.test(name))return fallback;
   if(!name.toLowerCase().endsWith('.'+format))return fallback;
   return name;
 }
 function resolve(sources,animeId,episode,preferredSource,base){
   const id=identity(animeId);
   if(!id||!Array.isArray(sources)||!Number.isSafeInteger(episode)||episode<1||episode>10000)return null;
   const baseUrl=typeof base==='string'&&base?base:'https://animevoid.ru/watch.html';
   const allowed=sources.filter(s=>s&&identity(s.animeId)===id&&s.allowOriginalDownload===true
     &&typeof s.id==='string'&&s.id.length>0&&Array.isArray(s.episodes));
   allowed.sort((a,b)=>(a.id===preferredSource?-1:0)-(b.id===preferredSource?-1:0));
   for(const source of allowed){
     const ep=source.episodes.find(e=>e&&e.number===episode);
     const file=ep?.originalFile;
     if(!file||file.licensed!==true||file.original!==true)continue;
     const format=String(file.format||'').toLowerCase();
     if(!formats.has(format))continue;
     const href=safeUrl(file.url,baseUrl);
     if(!href)continue;
     return Object.freeze({
       href,format,filename:filename(file.filename,id,episode,format),
       episode,sourceId:source.id,animeId:id,
       sameOrigin:new URL(href).origin===new URL(baseUrl).origin
     });
   }
   return null;
 }
 window.AVDownloadPolicy69=Object.freeze({resolve,identity});
})();