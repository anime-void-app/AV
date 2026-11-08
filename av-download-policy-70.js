/* ANIME VOID 70.0 — licensed download selection and presentation-only metadata.
   All file URLs must be explicitly granted by the catalog owner.
   Does not capture, transform, bypass or scrape playback streams. */
(()=>{
'use strict';
const ID=/^(?:anilist-)?[1-9][0-9]{0,9}$/;
const FORMATS=new Set(['mp4','mkv','webm','mov','m4v','avi']);
const QUALITY=/^(?:4320p|2160p|1440p|1080p|720p|576p|480p|360p)$/i;
const id=raw=>ID.test(String(raw||''))?'anilist-'+String(raw).replace(/^anilist-/,''):null;
function address(raw,base){
 if(typeof raw!=='string'||!raw.trim()||raw.length>2048)return null;
 try{
  const u=new URL(raw,base),home=new URL(base);
  if(u.username||u.password||u.hash)return null;
  if(u.protocol!=='https:'&&!(u.protocol==='http:'&&u.origin===home.origin))return null;
  return u.href;
 }catch{return null;}
}
function filename(raw,animeId,episode,format){
 const fallback='ANIME-VOID-'+animeId.replace('anilist-','')+'-E'+String(episode).padStart(2,'0')+'.'+format;
 if(typeof raw!=='string'||raw.length<3||raw.length>140)return fallback;
 const name=raw.trim();
 if(!/^[a-zA-Z0-9_ ()-]+\.(mp4|mkv|webm|mov|m4v|avi)$/i.test(name)||!name.toLowerCase().endsWith('.'+format))return fallback;
 return name;
}
function formatSize(bytes,lang='ru'){
 if(!Number.isSafeInteger(bytes)||bytes<1)return lang==='en'?'Size unknown':'Размер неизвестен';
 const units=['Б','КиБ','МиБ','ГиБ','ТиБ'],english=['B','KiB','MiB','GiB','TiB'];
 let n=bytes,i=0;
 while(n>=1024&&i<units.length-1){n/=1024;i++;}
 return (i===0?String(n):n.toFixed(n>=100?0:n>=10?1:2))+' '+(lang==='en'?english[i]:units[i]);
}
function list(sources,animeId,episode,preferredSource,base){
 const anime=id(animeId);
 if(!anime||!Array.isArray(sources)||!Number.isSafeInteger(episode)||episode<1||episode>10000)return [];
 const baseURL=typeof base==='string'&&base?base:'https://animevoid.ru/watch.html';
 const files=[],seen=new Set();
 for(const s of sources.slice(0,700)){
  if(!s||id(s.animeId)!==anime||s.allowOriginalDownload!==true||typeof s.id!=='string'||s.id.length>90||!Array.isArray(s.episodes))continue;
  const ep=s.episodes.find(e=>e&&e.number===episode);
  if(!ep)continue;
  const options=Array.isArray(ep.files)?ep.files.slice(0,24):ep.originalFile?[ep.originalFile]:[];
  for(const f of options){
   if(!f||f.licensed!==true||typeof f.original!=='boolean')continue;
   const format=String(f.format||'').toLowerCase();
   if(!FORMATS.has(format))continue;
   const quality=f.original?'original':String(f.quality||'').toLowerCase();
   if(!f.original&&!QUALITY.test(quality))continue;
   const href=address(f.url,baseURL);
   if(!href||seen.has(href))continue;
   seen.add(href);
   const bytes=Number.isSafeInteger(f.bytes)&&f.bytes>=1?f.bytes:null;
   files.push(Object.freeze({
    href,format,quality,original:f.original,bytes,episode,animeId:anime,
    filename:filename(f.filename,anime,episode,format),
    sourceId:s.id,sourceName:typeof s.label==='string'?s.label.slice(0,80):s.id,
    sameOrigin:new URL(href).origin===new URL(baseURL).origin
   }));
  }
 }
 files.sort((a,b)=>{
  if(a.original!==b.original)return a.original?-1:1;
  if(a.sourceId===preferredSource&&b.sourceId!==preferredSource)return -1;
  if(b.sourceId===preferredSource&&a.sourceId!==preferredSource)return 1;
  const height=x=>Number(String(x.quality).replace('p',''))||0;
  return height(b)-height(a);
 });
 return Object.freeze(files);
}
window.AVDownloadPolicy70=Object.freeze({id,address,list,formatSize});
})();