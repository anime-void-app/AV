/* ANIME VOID V83 — one-tap room creation from a verified anime title. No account writes. */
(()=>{
 'use strict';
 const raw=new URLSearchParams(location.search).get('id')||window.AV_PAGE?.id||'';
 const id=String(raw).replace(/^anilist-/,'');
 if(!/^[1-9]\d{0,9}$/.test(id))return;
 const root=document.getElementById('content');if(!root)return;
 let label=null,caption=null;
 const ru=()=>document.documentElement.lang!=='en';
 function translate(){
  if(label)label.textContent=ru()?'♡ Смотреть вместе':'♡ Watch together';
  if(caption)caption.textContent=ru()?
   'Создай приватную комнату для этого аниме и пригласи друга.':
   'Create a private room for this anime and invite a friend.';
 }
 function render(){
  const title=root.querySelector('#animeTitle');
  if(!title)return;
  if(title.parentElement?.querySelector('.av83-party-launch'))return;
  const wrap=document.createElement('div');wrap.className='av83-party-launch';
  const link=document.createElement('a');link.className='av83-party-link';
  link.href='party.html?anime='+encodeURIComponent('anilist-'+id);
  const info=document.createElement('span');info.className='av83-party-help';
  wrap.append(link,info);title.after(wrap);
  label=link;caption=info;translate();
 }
 render();
 new MutationObserver(render).observe(root,{childList:true,subtree:true});
 new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
