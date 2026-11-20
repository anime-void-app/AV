/* ANIME VOID V81 — Kodik selection survives AniList outages when a verified MAL ID is known.
   Official iframe only. No proxy, stream extraction, geoblock bypass or invented playback URLs. */
(()=>{'use strict';
if(window.__AVInlineKodik2414)return;window.__AVInlineKodik2414=true;
const id=String(new URLSearchParams(location.search).get('id')||'').replace(/^anilist-/,'');
if(!/^[1-9]\d*$/.test(id)||id==='4224')return;
const aid='anilist-'+id,C=window.AVKodikData,identity=window.AVVideoIdentity81,root=document.getElementById('avPlayer');
const hasNative=()=>window.AVVideoSources?.sources?.some(s=>s.animeId===aid);
if(!root||!C||!identity||hasNative())return;
const make=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e;};
const box=make('section'),heading=make('h2'),status=make('p'),label=make('label'),select=make('select'),view=make('div'),note=make('p'),link=make('a'),retry=make('button'),external=make('a');
box.id='avKodikBridge';box.setAttribute('aria-label','Плеер Kodik');
box.style.cssText='box-sizing:border-box;min-width:0;max-width:100%;border:1px solid #b383df55;background:#14101d;color:#e9daf6;border-radius:16px;padding:clamp(12px,3vw,22px);margin:16px 0';
heading.textContent='Плеер ANIME VOID · Kodik';
status.textContent='Ищем доступные варианты просмотра…';status.setAttribute('role','status');
label.textContent='Озвучка / субтитры ';select.id='avKodikTranslation';
select.style.cssText='display:block;box-sizing:border-box;width:100%;max-width:100%;padding:10px;margin:8px 0 14px;background:#21162f;color:#fff;border:1px solid #8760aa;border-radius:8px';
label.append(select);label.hidden=true;
view.id='avKodikInlineView';view.style.cssText='width:100%;aspect-ratio:16/9;background:#07050b;border-radius:10px;overflow:hidden';view.hidden=true;
note.textContent='Для запуска нажми ▶ в плеере. Если видео не открывается, проверь доступность самого Kodik. ANIME VOID не управляет доступностью внешнего источника.';
note.hidden=true;
link.href='kodik.html';link.textContent='Открыть каталог Kodik';link.style.cssText='display:inline-block;margin-top:10px;color:#e1c1ff';link.hidden=true;
retry.type='button';retry.textContent='Повторить попытку';retry.hidden=true;
retry.style.cssText='display:inline-block;margin:12px 12px 0 0;padding:10px 14px;border-radius:9px;border:1px solid #b383df;background:#36234c;color:#fff;font:600 13px system-ui;cursor:pointer';
retry.addEventListener('click',()=>location.reload());
external.textContent='Открыть у источника ↗';external.target='_blank';external.rel='noopener noreferrer';external.hidden=true;
external.style.cssText='display:inline-block;margin-top:12px;color:#e1c1ff';
box.append(heading,status,label,view,note,retry,link,external);root.before(box);
// The legacy native player has no source for these IDs; hiding it prevents two contradictory player cards.
root.style.setProperty('display','none','important');
let measured=null,disposed=false,frames=0;
const control=new AbortController(),timer=setTimeout(()=>control.abort(),22000);
function fallback(message){
 if(disposed)return;
 status.textContent=message;status.hidden=false;status.dataset.error='true';
 retry.hidden=false;link.hidden=false;label.hidden=true;view.hidden=true;note.hidden=true;external.hidden=true;
}
function play(data){
 measured?.dispose();measured=null;
 const variant=data.variants.find(v=>v.id===select.value),url=C.safeEmbed(variant?.embedUrl);
 if(!url){fallback('Выбранный адрес плеера недоступен. Попробуй другую озвучку.');return;}
 try{window.AVSoundShell?.stopForMedia();}catch{}
 const frame=make('iframe'),embed=new URL(url);
 if(data.type==='anime-serial'&&variant.lastSeasonReported===1){
  const requested=Number(new URLSearchParams(location.search).get('episode')||1);
  if(Number.isSafeInteger(requested)&&requested>=1&&requested<=Math.max(1,variant.episodesReported))
   {embed.searchParams.set('season','1');embed.searchParams.set('episode',String(requested));}
 }
 frame.src=embed.href;
 frame.title=(data.titleRu||data.titleOriginal||'Аниме')+' — '+C.clean(variant.translationTitle,120);
 frame.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';
 frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.style.cssText='display:block;width:100%;height:100%;border:0';
 frame.addEventListener('error',()=>{status.hidden=false;status.textContent='Не удалось открыть внешний видеоплеер. Можно проверить его напрямую.';});
 view.replaceChildren(frame);
 external.href=embed.href;external.hidden=false;
 if(window.AVMeasured)measured=AVMeasured.attach(frame,{
  titleId:data.id,title:data.titleRu||data.titleOriginal,kind:data.type==='anime'?'movie':'series',
  onIdentity(state){
   if(data.type==='anime'||variant.lastSeasonReported===1&&state.season===1&&state.episode<=data.episodesReported){
    const ep=data.type==='anime'?1:state.episode;
    window.AVWatchEpisodeChanged?.(ep);
    const u=new URL(location.href);u.searchParams.set('episode',ep);history.replaceState(null,'',u);
   }
  },
  onComplete(state){
   if(data.type==='anime'||variant.lastSeasonReported===1&&state.season===1&&state.episode<=data.episodesReported)
    return window.AVWatchAutoComplete?.(data.type==='anime'?1:state.episode,state.duration);
  }
 },box);
 frames++;
}
function localKnown(){
 let cached=null;
 try{
  const all=window.AVSafe?.read?.('animeVoidCatalog',[]);
  if(Array.isArray(all))cached=all.find(x=>String(x?.id)===aid)||null;
 }catch{}
 const known=window.AVTitles?.record?.({id:aid})||null;
 return identity.localMal(aid,cached,known);
}
async function resolveMal(){
 const locally=localKnown();
 if(locally)return locally;
 const response=await fetch('https://graphql.anilist.co',{
  method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
  signal:control.signal,
  body:JSON.stringify({query:'query($id:Int){Media(id:$id,type:ANIME){id idMal}}',variables:{id:Number(id)}})
 });
 if(!response.ok)throw Error('AniList HTTP '+response.status);
 const result=await response.json(),media=result?.data?.Media;
 if(media?.id!==Number(id))throw Error('AniList identity mismatch');
 return identity.safeMal(media.idMal);
}
async function boot(){
 try{
  const [catalog,mal]=await Promise.all([
   C.load((url,options={})=>fetch(url,{...options,signal:control.signal})),resolveMal()
  ]);
  if(disposed)return;
  if(!mal){fallback('Не удалось найти точное соответствие аниме. Попробуй поиск в каталоге Kodik.');return;}
  const item=catalog.titles.find(t=>t.id==='shikimori-'+mal);
  if(!item){fallback('В текущем каталоге Kodik нет подтверждённого источника для этого аниме.');return;}
  link.href='kodik.html?title='+encodeURIComponent(item.id);
  status.textContent='Загружаем доступные озвучки…';
  const data=await C.title(catalog,item,(url,options={})=>fetch(url,{...options,signal:control.signal}));
  if(disposed)return;
  if(hasNative()){root.style.removeProperty('display');box.remove();return;}
  const variants=data.variants.filter(v=>C.safeEmbed(v.embedUrl));
  if(!variants.length){fallback('В каталоге нет действительных адресов этого плеера.');return;}
  select.replaceChildren();
  for(const v of variants){
   const option=make('option');option.value=v.id;
   option.textContent=C.clean(v.translationTitle,120)+(v.translationType==='subtitles'?' · Субтитры':' · Озвучка');
   select.append(option);
  }
  status.textContent='';status.hidden=true;
  label.hidden=false;view.hidden=false;note.hidden=false;retry.hidden=true;link.hidden=true;
  select.addEventListener('change',()=>play(data));
  play(data);
 }catch(e){
  fallback(control.signal.aborted
   ?'Истёк срок загрузки каталога или соединения. Попробуй ещё раз. Если видеосервис не открывается напрямую, проблема может быть на стороне источника.'
   :'Не удалось получить данные Kodik или сведения об аниме. Проверь интернет и попробуй ещё раз.');
 }finally{clearTimeout(timer);}
}
void boot();
window.addEventListener('pagehide',event=>{
 if(event.persisted)return;
 disposed=true;control.abort();clearTimeout(timer);measured?.dispose();view.replaceChildren();
},{once:true});
})();
