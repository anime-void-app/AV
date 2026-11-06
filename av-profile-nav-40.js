/* ANIME VOID 40.0 — unobtrusive profile section navigation state. */
(()=>{'use strict';
  const nav=document.getElementById('profileSectionNav');
  if(!nav)return;
  const links=Array.from(nav.querySelectorAll('a[href^="#"]'));
  function sync(){
    const hash=location.hash || '#profileOverview';
    const selected=links.find(link=>link.getAttribute('href')===hash) || links[0];
    for(const link of links){
      if(link===selected)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  }
  addEventListener('hashchange',sync,{passive:true});
  sync();
})();
