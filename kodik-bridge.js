/* v24.14: inline official Kodik player; exact AniList idMal mapping only.
 * Never modifies account/progress, native registered sources or Toradora.
 */
(()=>{'use strict';
if(window.__AVInlineKodik2414)return;window.__AVInlineKodik2414=true;
const id=String(new URLSearchParams(location.search).get('id')||'').replace(/^anilist-/,'');
if(!/^[1-9]\d*$/.test(id)||id==='4224')return;
const aid='anilist-'+id,C=window.AVKodikData,root=document.getElementById('avPlayer');
if(!root||!C||window.AVVideoSources?.sources?.some(s=>s.animeId===aid))return;
const box=document.createElement('section'),heading=document.createElement('h2'),status=document.createElement('p'),label=document.createElement('label'),select=document.createElement('select'),view=document.createElement('div'),note=document.createElement('p'),link=document.createElement('a');
box.id='avKodikBridge';box.setAttribute('aria-label','Плеер Kodik');box.style.cssText='box-sizing:border-box;min-width:0;max-width:100%;border:1px solid #b383df55;background:#14101d;color:#e9daf6;border-radius:16px;padding:clamp(12px,3vw,22px);margin:16px 0';
heading.textContent='Плеер ANIME VOID · Kodik';status.textContent='Подключаем плеер…';status.setAttribute('role','status');
label.textContent='Озвучка / субтитры ';select.id='avKodikTranslation';select.style.cssText='display:block;box-sizing:border-box;width:100%;max-width:100%;padding:10px;margin:8px 0 14px;background:#21162f;color:#fff;border:1px solid #8760aa;border-radius:8px';label.append(select);label.hidden=true;
view.id='avKodikInlineView';view.style.cssText='width:100%;aspect-ratio:16/9;background:#07050b;border-radius:10px;overflow:hidden';view.hidden=true;
note.textContent='Сезон и серию выбирай внутри плеера. Для запуска видео нажми ▶. Доступность определяет Kodik.';note.hidden=true;
link.href='kodik.html';link.textContent='Поиск в каталоге Kodik';link.style.color='#cda5f4';link.hidden=true;
box.append(heading,status,label,view,note,link);root.before(box);
let measured=null;let disposed=false;const control=new AbortController(),timer=setTimeout(()=>control.abort(),15000);
function play(data){measured?.dispose();measured=null;const v=data.variants.find(x=>x.id===select.value),url=C.safeEmbed(v?.embedUrl);if(!url)return;
try{window.AVSoundShell?.stopForMedia();}catch{}
const frame=document.createElement('iframe');const embed=new URL(url);if(data.type==='anime-serial'&&v.lastSeasonReported===1){const requested=Number(new URLSearchParams(location.search).get('episode')||1);if(Number.isSafeInteger(requested)&&requested>=1&&requested<=Math.max(1,v.episodesReported)){embed.searchParams.set('season','1');embed.searchParams.set('episode',String(requested));}}frame.src=embed.href;frame.title=(data.titleRu||data.titleOriginal||'Аниме')+' — '+C.clean(v.translationTitle,120);frame.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.style.cssText='display:block;width:100%;height:100%;border:0';view.replaceChildren(frame);if(window.AVMeasured)measured=AVMeasured.attach(frame,{titleId:data.id,title:data.titleRu||data.titleOriginal,kind:data.type==='anime'?'movie':'series',onIdentity(state){if(data.type==='anime'||v.lastSeasonReported===1&&state.season===1&&state.episode<=data.episodesReported){const ep=data.type==='anime'?1:state.episode;window.AVWatchEpisodeChanged?.(ep);const u=new URL(location.href);u.searchParams.set('episode',ep);history.replaceState(null,'',u);}},onComplete(state){if(data.type==='anime'||v.lastSeasonReported===1&&state.season===1&&state.episode<=data.episodesReported)return window.AVWatchAutoComplete?.(data.type==='anime'?1:state.episode,state.duration);}},box);
}
function fallback(message){if(disposed)return;status.textContent=message;link.hidden=false;root.style.removeProperty('display');}
Promise.all([C.load(),fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($id:Int){Media(id:$id,type:ANIME){idMal}}',variables:{id:Number(id)}}),signal:control.signal}).then(r=>{if(!r.ok)throw Error('metadata');return r.json();})])
.then(async([catalog,result])=>{const mal=result?.data?.Media?.idMal;if(!Number.isSafeInteger(mal)||mal<1){fallback('Не удалось сопоставить аниме с Kodik. Можно воспользоваться поиском.');return;}
const item=catalog.titles.find(t=>t.id==='shikimori-'+mal);if(!item){fallback('Для этого аниме нет записи в текущем каталоге Kodik.');return;}
link.href='kodik.html?title='+encodeURIComponent(item.id);const data=await C.title(catalog,item);if(disposed)return;
// Recheck native registration after asynchronous metadata loading.
if(window.AVVideoSources?.sources?.some(s=>s.animeId===aid)){box.remove();return;}
for(const v of data.variants){const option=document.createElement('option');option.value=v.id;option.textContent=C.clean(v.translationTitle,120)+(v.translationType==='subtitles'?' · Субтитры':' · Озвучка');select.append(option);}
status.textContent='';status.hidden=true;label.hidden=false;view.hidden=false;note.hidden=false;
// Separate mount survives late legacy-player rendering, with no mutation loops.
root.style.setProperty('display','none','important');select.addEventListener('change',()=>play(data));play(data);
}).catch(()=>fallback('Не удалось загрузить плеер. Обнови страницу или проверь публикацию папки kodik-data.')).finally(()=>clearTimeout(timer));
window.addEventListener('pagehide',(event)=>{if(event.persisted)return;disposed=true;control.abort();clearTimeout(timer);measured?.dispose();view.replaceChildren();},{once:true});
})();
