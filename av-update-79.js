/* ANIME VOID V79 — a non-interrupting PWA update prompt. */
(()=>{'use strict';
 if(!('serviceWorker' in navigator)||self!==top)return;
 const sw=navigator.serviceWorker;
 let wasControlled=Boolean(sw.controller),pending=false,dismissed=false,bar=null;
 const ru=()=>document.documentElement.lang!=='en';
 function translate(){
  if(!bar)return;
  bar.querySelector('.av79-text').textContent=ru()?'Доступно обновление ANIME VOID. Обновить страницу?':'An ANIME VOID update is available. Refresh the page?';
  bar.querySelector('.av79-apply').textContent=ru()?'Обновить':'Refresh';
  bar.querySelector('.av79-close').setAttribute('aria-label',ru()?'Закрыть':'Dismiss');
 }
 function show(){
  if(!pending||dismissed||document.visibilityState==='hidden'||!document.body)return;
  if(!bar){
   bar=document.createElement('aside');
   bar.className='av79-update';bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
   const text=document.createElement('span');text.className='av79-text';
   const apply=document.createElement('button');apply.type='button';apply.className='av79-apply';
   apply.addEventListener('click',()=>location.reload());
   const close=document.createElement('button');close.type='button';close.className='av79-close';close.textContent='×';
   close.addEventListener('click',()=>{dismissed=true;bar.hidden=true});
   bar.append(text,apply,close);document.body.append(bar);
   new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  bar.hidden=false;translate();
 }
 sw.addEventListener('controllerchange',()=>{if(wasControlled){pending=true;show()}wasControlled=true});
 document.addEventListener('visibilitychange',show);
 addEventListener('pageshow',show);
})();