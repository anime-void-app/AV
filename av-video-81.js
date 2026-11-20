/* ANIME VOID V81 — local verified anime identity fallback; no network, storage or permissions. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.AVVideoIdentity81=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ID=/^anilist-[1-9]\d*$/;
 function safeMal(value){return Number.isSafeInteger(Number(value))&&Number(value)>0&&Number(value)<=2147483647?Number(value):null;}
 function localMal(aid,cached,known){
  if(typeof aid!=='string'||!ID.test(aid))return null;
  if(cached&&String(cached.id)===aid){const n=safeMal(cached.idMal);if(n)return n;}
  if(known&&String(known.id)===aid)return safeMal(known.mal);
  return null;
 }
 function fallbackTitle(aid,known){
  if(!ID.test(String(aid||''))||!known||String(known.id)!==aid)return null;
  const title=String(known.ru||known.en||known.romaji||'').slice(0,240);
  if(!title)return null;
  return {id:aid,title,ruTitle:String(known.ru||'').slice(0,240),
   titleEnglish:String(known.en||'').slice(0,240),
   titleRomaji:String(known.romaji||'').slice(0,240),idMal:safeMal(known.mal),
   episodes:null,format:null};
 }
 function hasEpisodeCount(item){
  if(!item)return false;
  if(String(item.format||'').toUpperCase()==='MOVIE')return true;
  const n=Number(item.episodes);return Number.isSafeInteger(n)&&n>=1&&n<=10000;
 }
 return Object.freeze({localMal,fallbackTitle,hasEpisodeCount,safeMal});
});
