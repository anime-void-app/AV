/* ANIME VOID V77 — visible UI only, no account/progress/rewards mutations. */
(()=>{'use strict';
 if(!document.body?.classList.contains('av-home'))return;
 const isRu=()=>document.documentElement.lang!=='en';
 const translate=()=>{
  for(const node of document.querySelectorAll('[data-v77-ru][data-v77-en]'))
   node.textContent=isRu()?node.dataset.v77Ru:node.dataset.v77En;
 };
 let promptEvent=null;
 const install=document.getElementById('av77Install');
 addEventListener('beforeinstallprompt',event=>{
  if(!install)return;
  event.preventDefault();promptEvent=event;install.hidden=false;
 });
 addEventListener('appinstalled',()=>{promptEvent=null;if(install)install.hidden=true;});
 install?.addEventListener('click',async()=>{
  if(!promptEvent)return;
  const event=promptEvent;promptEvent=null;install.hidden=true;
  try{await event.prompt();await event.userChoice;}catch{}
 });
 const quick=document.querySelector('.av51-home-shortcuts');
 if(quick&&!quick.querySelector('a[href="match.html"]')){
  const link=document.createElement('a');link.href='match.html';
  link.dataset.v77Ru='♡ Подбор для двоих';link.dataset.v77En='♡ Match for two';
  link.textContent=isRu()?link.dataset.v77Ru:link.dataset.v77En;
  quick.append(link);
 }
 // Native lazy loading of below-the-fold posters; never change URLs or eager media.
 const galleries=[...document.querySelectorAll('#animeGrid,#favoritesGrid,#recommendedRow,#topGrid,#airingRow,#donghuaAiringRow,#moodResults')];
 function decorateImages(element){
  if(element?.nodeType!==1)return;
  const items=element.matches?.('img')?[element]:element.querySelectorAll?.('img');
  for(const img of items||[]){
   if(!img.hasAttribute('loading'))img.loading='lazy';
   if(!img.hasAttribute('decoding'))img.decoding='async';
  }
 }
 for(const gallery of galleries){
  decorateImages(gallery);
  new MutationObserver(records=>{
   for(const entry of records)for(const child of entry.addedNodes)decorateImages(child);
  }).observe(gallery,{childList:true,subtree:true});
 }
 new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 translate();
})();