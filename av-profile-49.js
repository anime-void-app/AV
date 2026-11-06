/* ANIME VOID 49.0 — presentation/navigation only. No wallet or history mutations. */
(() => {
  'use strict';
  if(!document.body.classList.contains('av-profile-page'))return;
  const scenes=[
    ['v49-banner-sakura-moon','Луна цветущего Киото','Moonlit Sakura','sakura-moon'],
    ['v49-banner-crimson-ronin','Алый путь ронина','Crimson Ronin','crimson-ronin'],
    ['v49-banner-azure-storm','Дворец небесной бури','Azure Tempest','azure-storm'],
    ['v49-banner-golden-torii','Врата золотого заката','Golden Torii','golden-torii'],
    ['v49-banner-emerald-spirit','Шёпот духовного леса','Spirit Forest','emerald-spirit'],
    ['v49-banner-frozen-shrine','Храм зимнего созвездия','Frozen Shrine','frozen-shrine']
  ];
  const ru=()=>document.documentElement.lang!=='en';
  const tr=(a,b)=>ru()?a:b;
  const el=(tag,className,content)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(content!==undefined)node.textContent=content;
    return node;
  };
  const labels=[];
  function localized(node,a,b){labels.push({node,a,b});node.textContent=tr(a,b);return node;}
  function gallery(){
    const hero=document.getElementById('profileOverview');
    if(!hero||document.getElementById('av49Gallery'))return;
    const section=el('section','av49-gallery');
    section.id='av49Gallery';
    section.setAttribute('aria-labelledby','av49GalleryHeading');
    const head=el('div','av49-gallery-header'),intro=el('div');
    const small=localized(el('small','av-reborn-eyebrow'),'НОВАЯ КОЛЛЕКЦИЯ · 49.0','NEW COLLECTION · 49.0');
    const title=localized(el('h2'),'Новые миры для твоего профиля','New worlds for your profile');
    title.id='av49GalleryHeading';
    intro.append(small,title,localized(el('p'),'6 новых панорам. Примерь бесплатно в мастерской — твои прежние баннеры сохранятся.','6 new panoramas. Claim them for free in the studio; your old banners stay intact.'));
    const link=localized(el('a'),'Все баннеры в мастерской','All banners in studio');
    link.href='#profileWorkshop';
    link.addEventListener('click',event=>{
      if(typeof window.AVArtAtelier?.open!=='function')return;
      event.preventDefault();window.AVArtAtelier.open();
    });
    head.append(intro,link);
    const grid=el('div','av49-gallery-grid');
    for(const [id,a,b,slug] of scenes){
      const button=el('button','av49-gallery-card');button.type='button';button.dataset.bannerId=id;
      button.setAttribute('aria-label',tr('Примерить: ','Preview: ')+tr(a,b));
      const img=el('img');img.src='studio/v49/'+slug+'.svg';
      img.alt='';img.loading='lazy';img.decoding='async';
      const name=localized(el('span'),a,b);
      button.append(img,name);
      button.addEventListener('click',()=>{
        if(typeof window.AVProfileStudio?.openCategory==='function'){
          window.AVProfileStudio.openCategory('banner',id);
        }else if(typeof window.AVArtAtelier?.open==='function'){
          window.AVArtAtelier.open();
        }else{
          location.hash='#profileWorkshop';
        }
      });
      grid.append(button);
    }
    section.append(head,grid);
    const following=document.querySelector('.av-46-profile-journey');
    if(following)following.insertAdjacentElement('beforebegin',section);
    else hero.insertAdjacentElement('afterend',section);
  }
  function bannerControl(){
    const banner=document.getElementById('avpBanner');
    if(!banner||document.getElementById('av49BannerButton'))return false;
    const btn=localized(el('button','av49-banner-button'),'◈ Сменить баннер','◈ Change banner');
    btn.type='button';btn.id='av49BannerButton';
    btn.addEventListener('click',()=>{
      if(typeof window.AVArtAtelier?.open==='function')window.AVArtAtelier.open();
      else window.AVProfileStudio?.openCategory?.('banner');
    });
    banner.append(btn);
    return true;
  }
  function language(){
    for(const {node,a,b} of labels)node.textContent=tr(a,b);
    for(const [id,a,b] of scenes){
      const button=document.querySelector('.av49-gallery-card[data-banner-id="'+id+'"]');
      if(button)button.setAttribute('aria-label',tr('Примерить: ','Preview: ')+tr(a,b));
    }
  }
  gallery();
  bannerControl();
  if(!document.getElementById('av49BannerButton')){
    const watch=new MutationObserver(()=>{
      if(bannerControl())watch.disconnect();
    });
    watch.observe(document.getElementById('profileOverview')||document.body,{childList:true,subtree:true});
    addEventListener('pagehide',()=>watch.disconnect(),{once:true});
  }
  new MutationObserver(language).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();