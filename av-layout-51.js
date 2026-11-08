/* ANIME VOID 62.0 — existing navigation enhancement.
   Only DOM presentation; never touches authentication, cosmetics, purchases or viewing history. */
(() => {
  'use strict';
  const root=document.body;
  if(!root?.classList?.contains('av-home')&&!root?.classList?.contains('av-profile-page'))return;
  const isHome=root.classList.contains('av-home');
  const header=document.querySelector('body > header');
  if(!header)return;
  const isRu=()=>document.documentElement.lang!=='en';
  const tr=(ru,en)=>isRu()?ru:en;
  const translations=[];
  const make=(tag,className)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    return node;
  };
  function translate(node,ru,en){
    translations.push({node,ru,en});
    node.textContent=tr(ru,en);
    return node;
  }
  function makeLink(href,ru,en){
    const link=translate(make('a'),ru,en);
    link.href=href;
    return link;
  }
  let menuButton=null,profileNav=null,syncHomeMenu=()=>{};
  function setProfileOpen(open,focus=false){
    if(!menuButton)return;
    const expanded=Boolean(open);
    header.classList.toggle('av51-profile-menu-open',expanded);
    menuButton.setAttribute('aria-expanded',String(expanded));
    menuButton.textContent=expanded?'×':'☰';
    menuButton.setAttribute('aria-label',expanded?tr('Закрыть меню','Close menu'):tr('Открыть меню','Open menu'));
    if(focus)menuButton.focus();
  }
  if(!isHome){
    profileNav=header.querySelector(':scope > nav');
    if(profileNav){
      if(!profileNav.id)profileNav.id='av51ProfileHeaderNav';
      profileNav.setAttribute('aria-label',tr('Навигация по сайту','Site navigation'));
      menuButton=make('button','av51-profile-menu-toggle');
      menuButton.id='av51ProfileMenuToggle';
      menuButton.type='button';
      menuButton.setAttribute('aria-controls',profileNav.id);
      menuButton.setAttribute('aria-expanded','false');
      menuButton.textContent='☰';
      menuButton.addEventListener('click',()=>{
        setProfileOpen(!header.classList.contains('av51-profile-menu-open'));
      });
      const logo=header.querySelector(':scope > .logo');
      if(logo)logo.insertAdjacentElement('afterend',menuButton);
      else header.prepend(menuButton);
      const routes=[
        ['history.html','История','History'],
        ['party.html','Смотреть вместе','Watch together'],
        ['collections.html','Коллекции','Collections'],
        ['account.html','Аккаунт','Account']
      ];
      for(const [href,ru,en] of routes){
        if(profileNav.querySelector('a[href="'+href+'"]'))continue;
        const item=makeLink(href,ru,en);
        item.classList.add('av51-mobile-link');
        profileNav.append(item);
      }
      profileNav.addEventListener('click',event=>{
        if(event.target.closest('a[href]'))setProfileOpen(false);
      });
      document.addEventListener('pointerdown',event=>{
        if(header.classList.contains('av51-profile-menu-open')&&!header.contains(event.target)){
          setProfileOpen(false);
        }
      });
      document.addEventListener('keydown',event=>{
        if(event.key==='Escape'&&header.classList.contains('av51-profile-menu-open')){
          setProfileOpen(false,true);
        }
      });
      const desktop=window.matchMedia?.('(min-width:761px)');
      desktop?.addEventListener?.('change',event=>{if(event.matches)setProfileOpen(false);});
    }
  }else{
    // The original homepage menu exists in av-design.js. Do not create another.
    const panel=header.querySelector('#avHeaderPanel');
    const homeToggle=header.querySelector('.av-menu-toggle');
    // av-design owns the actual open/close action. Reflect its class state
    // so an outside click, focus on search or a resize never leaves a stale ×.
    syncHomeMenu=()=>{
      if(!homeToggle)return;
      const open=header.classList.contains('av-tools-open');
      homeToggle.textContent=open?'×':'☰';
      homeToggle.setAttribute('aria-expanded',String(open));
      homeToggle.setAttribute('aria-label',open?tr('Закрыть меню','Close menu'):tr('Открыть меню','Open menu'));
      homeToggle.setAttribute('title',open?tr('Закрыть меню','Close menu'):tr('Открыть меню','Open menu'));
    };
    const closeHomeMenu=(focus=false)=>{
      if(!header.classList.contains('av-tools-open'))return;
      header.classList.remove('av-tools-open');
      syncHomeMenu();
      if(focus)homeToggle?.focus();
    };
    if(panel&&!panel.querySelector('.av51-home-shortcuts')){
      const shortcuts=make('div','av51-home-shortcuts');
      shortcuts.setAttribute('role','group');
      shortcuts.append(
        makeLink('party.html','🎬 Смотреть вместе','🎬 Watch together'),
        makeLink('history.html','◷ История','◷ History'),
        makeLink('account.html','⚙ Аккаунт','⚙ Account'),
        makeLink('collections.html','♡ Коллекции','♡ Collections')
      );
      panel.append(shortcuts);
      shortcuts.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeHomeMenu()));
    }
    document.getElementById('search')?.addEventListener('focus',()=>closeHomeMenu());
    homeToggle?.addEventListener('click',syncHomeMenu);
    new MutationObserver(syncHomeMenu).observe(header,{attributes:true,attributeFilter:['class']});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&header.classList.contains('av-tools-open'))closeHomeMenu(true);
    });
    addEventListener('hashchange',()=>closeHomeMenu());
    addEventListener('pageshow',syncHomeMenu);
    syncHomeMenu();
  }
  function updateLanguage(){
    for(const {node,ru,en} of translations)node.textContent=tr(ru,en);
    if(menuButton){profileNav?.setAttribute('aria-label',tr('Навигация по сайту','Site navigation'));setProfileOpen(header.classList.contains('av51-profile-menu-open'));}
    syncHomeMenu();
    const quick=header.querySelector('.av51-home-shortcuts');
    if(quick)quick.setAttribute('aria-label',tr('Быстрые разделы','Quick sections'));
  }
  updateLanguage();
  new MutationObserver(updateLanguage).observe(document.documentElement,{
    attributes:true,attributeFilter:['lang']
  });
})();