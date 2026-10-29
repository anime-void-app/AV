"use strict";
(() => {
 const base = "https://anime-void-app.github.io/AV/";
 const routes = {"anilist-1535": "anime-death-note.html", "anilist-5081": "anime-bakemonogatari.html", "anilist-16498": "anime-attack-on-titan.html", "anilist-101922": "anime-demon-slayer.html", "anilist-113415": "anime-jujutsu-kaisen.html", "anilist-21": "anime-one-piece.html", "anilist-11061": "anime-hunter-x-hunter.html", "anilist-21087": "anime-one-punch-man.html", "anilist-20954": "anime-a-silent-voice.html", "anilist-21459": "anime-my-hero-academia.html"};
 window.avAnimeUrl = id => routes[String(id)] || "anime.html?id=" + encodeURIComponent(id);
 document.addEventListener("click", event => {
   const a = event.target.closest("a[href]"); if (!a) return;
   const url = new URL(a.href, location.href);
   if (url.origin === location.origin && url.pathname.endsWith("/anime.html")) {
     const route = routes[url.searchParams.get("id")];
     if (route) a.href = new URL(route, new URL(".", location.href)).href;
   }
 }, true);
 const isAnime = /\/anime(?:-[a-z-]+)?\.html$/.test(location.pathname);
 const isWatch = location.pathname.endsWith("/watch.html");
 if (!isAnime && !isWatch) return;
 const header = document.querySelector("header"); if (!header) return;
 const button = document.createElement("button"); button.type="button";button.className="av-share";button.id="avShare";header.append(button);
 const ru = () => document.documentElement.lang !== "en";
 const label = () => {button.textContent=ru()?"Поделиться":"Share";button.setAttribute("aria-label",ru()?"Поделиться ссылкой на аниме":"Share anime link");};
 label();new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 const toast=document.createElement("div");toast.className="av-toast";toast.setAttribute("role","status");toast.hidden=true;document.body.append(toast);let timer;
 function notify(text){clearTimeout(timer);toast.textContent=text;toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,3500);}
 function shareURL(){
   const params=new URLSearchParams(location.search);const id=params.get("id") || window.AV_PAGE?.id;
   if(isWatch && id){const u=new URL("watch.html",base);u.searchParams.set("id",id);u.searchParams.set("episode",params.get("episode")||"1");return u.href;}
   if(id)return new URL(window.avAnimeUrl(id),base).href;
   return new URL(location.pathname,location.origin).href;
 }
 async function copy(url){
   try {if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(url);notify(ru()?"Ссылка скопирована":"Link copied");return;}}catch(e){}
   const area=document.createElement("textarea");area.value=url;area.readOnly=true;area.style.cssText="position:fixed;top:0;left:0;opacity:0";document.body.append(area);area.select();let ok=false;try{ok=document.execCommand("copy");}catch(e){}area.remove();
   if(ok)notify(ru()?"Ссылка скопирована":"Link copied");else window.prompt(ru()?"Скопируй ссылку:":"Copy this link:",url);
 }
 button.addEventListener("click",async()=>{
   const url=shareURL();const title=document.querySelector("#animeTitle")?.textContent || document.title;
   if(navigator.share){try{await navigator.share({title,url});return;}catch(e){if(e.name==="AbortError")return;}}
   await copy(url);
 });
 const params=new URLSearchParams(location.search),id=params.get("id")||window.AV_PAGE?.id;
 if(isAnime && id){
   const url=new URL(window.avAnimeUrl(id),base).href;
   let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement("link");canonical.rel="canonical";document.head.append(canonical);}canonical.href=url;
   const og=document.querySelector('meta[property="og:url"]');if(og)og.content=url;
 }
})();
