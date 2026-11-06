/* ANIME VOID 51.0 — existing navigation enhancement.
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
  let menuButton=null,profileNav=null;
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
    if(panel&&!panel.querySelector('.av51-home-shortcuts')){
      const shortcuts=make('div','av51-home-shortcuts');
      shortcuts.setAttribute('role','group');
      const history=makeLink('history.html','◷ История','◷ History');
      const account=makeLink('account.html','⚙ Аккаунт','⚙ Account');
      const collections=makeLink('collections.html','♡ Коллекции','♡ Collections');
      shortcuts.append(history,account,collections);
      panel.append(shortcuts);
      shortcuts.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
        header.classList.remove('av-tools-open');
        homeToggle?.setAttribute('aria-expanded','false');
      }));
    }
    const search=document.getElementById('search');
    search?.addEventListener('focus',()=>{
      if(header.classList.contains('av-tools-open')){
        header.classList.remove('av-tools-open');
        homeToggle?.setAttribute('aria-expanded','false');
      }
    });
    homeToggle?.addEventListener('click',()=>{
      homeToggle.textContent=header.classList.contains('av-tools-open')?'×':'☰';
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&header.classList.contains('av-tools-open')){
        header.classList.remove('av-tools-open');
        homeToggle?.setAttribute('aria-expanded','false');
        homeToggle.textContent='☰';
        homeToggle.focus();
      }
    });
    document.addEventListener('click',()=>{
      if(homeToggle&&!header.classList.contains('av-tools-open')&&homeToggle.textContent!=='☰')homeToggle.textContent='☰';
    });
  }
  function updateLanguage(){
    for(const {node,ru,en} of translations)node.textContent=tr(ru,en);
    if(menuButton)setProfileOpen(header.classList.contains('av51-profile-menu-open'));
    const quick=header.querySelector('.av51-home-shortcuts');
    if(quick)quick.setAttribute('aria-label',tr('Быстрые разделы','Quick sections'));
  }
  updateLanguage();
  new MutationObserver(updateLanguage).observe(document.documentElement,{
    attributes:true,attributeFilter:['lang']
  });
})();