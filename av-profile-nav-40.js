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
    // Reveal the active tab horizontally without scrolling the entire page.
    if(selected && window.matchMedia('(max-width:760px)').matches){
      const tab=selected.getBoundingClientRect(),pane=nav.getBoundingClientRect();
      if(tab.left<pane.left+8)nav.scrollLeft+=tab.left-pane.left-8;
      else if(tab.right>pane.right-8)nav.scrollLeft+=tab.right-pane.right+8;
    }
  }
  addEventListener('hashchange',sync,{passive:true});
  sync();
})();
