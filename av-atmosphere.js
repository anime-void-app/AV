/* source-localized24 */
var I24=window.AVSiteI18n24;
/* ANIME VOID v18 — seven attributed real field recordings; no synthesis, autoplay or microphone. */
(()=>{'use strict';
try{if(parent!==window&&parent.location.origin===location.origin&&parent.AVSoundShell){const header=document.querySelector('header');if(header){const b=document.createElement('button');b.id='avAmbienceToggle';b.className='theme-toggle av-ambience-toggle';b.type='button';I24.text(b,()=>(I24.t("♫ Музыка")));I24.attr(b,'aria-label',()=>(I24.t("Звуки атмосферы")));b.onclick=()=>parent.AVSoundShell.openAudio();const pause=document.createElement('button');pause.type='button';pause.className='m21-audio-quick';pause.textContent='Ⅱ';I24.attr(pause,'aria-label',()=>(I24.t("Остановить фоновый звук")));pause.onclick=()=>parent.AVAmbience?.stop?.();(header.querySelector('.header-actions')||header).append(pause);(header.querySelector('.header-actions')||header).append(b);const sync=()=>{const active=parent.AVAmbience?.active();I24.text(b,()=>((active?(parent.document.getElementById('avAmbienceToggle')?.textContent||I24.t("♫ Играет")):I24.t("♫ Музыка"))));const label=parent.document.getElementById('avAmbienceToggle')?.getAttribute('aria-label');if(label)b.setAttribute('aria-label',label);pause.hidden=!active;};parent.addEventListener('av:audio-state',sync);addEventListener('pagehide',()=>parent.removeEventListener('av:audio-state',sync),{once:true});sync();}document.addEventListener('play',e=>{if(e.target instanceof HTMLMediaElement&&!e.target.muted&&e.target.volume>0)parent.AVSoundShell.stopForMedia();},true);return;}}catch{}

const KEY='animeVoidAmbience',modes=[['train','🚆','Поезд · линия Дзёбан','Train · Joban Line'],['hokkaido','🚃','Поезд · Хоккайдо','Train · Hokkaido'],['japan-rain','🌧️','Дождь · Япония','Rain · Japan'],['rain-wind','🌬️','Дождь и ветер · Лондон','Rain and wind · London'],['stream','💧','Ручей рядом','Nearby stream'],['night-forest','🌲','Ночной лес · Мёдлинг','Night forest · Mödling'],['forest-water','🏞️','Лесной ручей · Канада','Forest stream · Canada']];
const recordings=Object.fromEntries(modes.map(m=>[m[0],'audio/'+m[0]+'-v18.mp3']));
modes.push(['window','🌧','Дождь за окном · микс','Rain window · mix'],['rail-rain','🚉','Дождливое путешествие · микс','Rain journey · mix'],['river','🌊','Большая вода · микс','River · mix'],['distant-train','🌙','Дальний поезд · обработка','Distant train · edit'],['guitar-night','🎸','Midnight Tale · гитара и лютня','Midnight Tale · guitar and lute'],['guitar-sun','☀','Somewhere Sunny · гитара','Somewhere Sunny · guitar'],['carefree','✨','Carefree · светлый мини-трек','Carefree · bright mini track'],['easy-lemon','🍋','Easy Lemon · мини-трек','Easy Lemon · mini track'],['piano-dreams','🌌','Dreams Become Real · пиано','Dreams Become Real · piano'],['piano-culture','💜','Dream Culture · пиано','Dream Culture · piano'],['harp-evening','🌒','Evening Fall · арфа','Evening Fall · harp']);
for(const k of ['window','rail-rain','river','distant-train','guitar-night','guitar-sun','carefree','easy-lemon'])recordings[k]='audio/'+k+'-v21.mp3';Object.assign(recordings,{'piano-dreams':'studio/v20/dreams.mp3','piano-culture':'studio/v20/culture.mp3','harp-evening':'studio/v20/evening.mp3'});

const originalModes=[['original-rain','🌧️','Дождик за окном','Rain at the window'],['original-train','🚆','Ночной поезд','Night train'],['original-rail','🚉','Поезд под дождём','Rainy train'],['original-forest','🌲','Лесной ветер','Forest breeze']];
modes.unshift(...originalModes);
function originalBuffer(ctx,id){
 const n=Math.floor(ctx.sampleRate*5),buffer=ctx.createBuffer(2,n,ctx.sampleRate);
 for(let c=0;c<2;c++){let out=buffer.getChannelData(c),seed=15793+c*29,low=0;
 for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;let w=seed/2147483648-1,t=i/ctx.sampleRate;low=low*.981+w*.019;
 let beat=Math.exp(-((t+c*.08)%.66)*20),rain=w*.18+low*.8,train=low*1.6+beat*.22+Math.sin(t*340)*.04;
 let signal=id==='original-rain'?rain:id==='original-train'?train:id==='original-rail'?rain*.6+train*.55:low*1.3+w*.03;
 let fade=Math.max(0,Math.min(1,i/(ctx.sampleRate*.08),(n-i-1)/(ctx.sampleRate*.08)));
 out[i]=Math.max(-.75,Math.min(.75,signal*2))*fade;
 }}
 return buffer;
}

const decoded=new Map();let download=null;
function recordingHeadroom(buffer){
 let peak=0;
 for(let c=0;c<buffer.numberOfChannels;c++){const a=buffer.getChannelData(c);for(let i=0;i<a.length;i++)peak=Math.max(peak,Math.abs(a[i]));}
 if(!Number.isFinite(peak)||!peak)throw Error('Invalid audio signal');
 if(peak>.85){const gain=.85/peak;for(let c=0;c<buffer.numberOfChannels;c++){const a=buffer.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=gain;}}
 return buffer;
}
const ru=()=>document.documentElement.lang!=='en';
let prefs={sound:'original-rain',volume:.25};
function read(){prefs={sound:'original-rain',volume:.25};try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Number.isFinite(v.volume)&&v.volume>=0&&v.volume<=1)prefs={sound:v.sound?.startsWith('original-')&&modes.some(m=>m[0]===v.sound)?v.sound:'original-rain',volume:v.volume};}catch(e){}}
read();let context=null,source=null,master=null,playing=false,panel=null,invoker=null,operation=0,message='',busy=false;
const header=document.querySelector('header');if(!header)return;
const button=document.createElement('button');button.id='avAmbienceToggle';button.className='theme-toggle av-ambience-toggle';button.type='button';I24.text(button,()=>(I24.t("♫ Музыка")));button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
(document.body.classList.contains('av-home')?header:(header.querySelector('.header-actions')||header)).append(button);
function labels(){I24.text(button,()=>((busy?(ru()?I24.t("⌛ Загрузка"):'⌛ Loading'):(playing?('♫ '+(modes.find(m=>m[0]===prefs.sound)?.[ru()?2:3]||'Music')):('♫ '+(ru()?I24.t("Звуки"):'Music'))))));const quick=document.getElementById('avAmbienceQuickPause');if(quick)quick.hidden=!(playing||busy);button.title=(ru()?I24.t("Музыка и атмосфера"):'Music and atmosphere');I24.attr(button,'aria-label',()=>(((ru()?I24.t("Музыка и атмосфера"):'Music and atmosphere')+(playing?(ru()?I24.t(" — включены"):' — playing'):''))));button.classList.toggle('is-playing',playing);if(panel)paint();dispatchEvent(new Event('av:audio-state'));}
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){message=ru()?'Настройки действуют сейчас, но сохранить их не удалось.':'Settings work now but could not be saved.';}}
function stop(note=''){
 download?.abort();download=null;
 operation++;playing=false;busy=false;
 if(master&&context){try{master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(0,context.currentTime,.025);}catch(e){}}
 const oldSource=source,oldContext=context;source=null;master=null;context=null;
 if(oldSource){try{oldSource.stop((oldContext?.currentTime||0)+.08);}catch(e){}}
 if(oldContext)setTimeout(()=>oldContext.close().catch(()=>{}),120);
 message=note;labels();
}
async function start(){
 if(document.hidden)return;
 stop();const version=++operation;busy=true;message='';labels();
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unsupported');
  const ctx=new Audio();context=ctx;
  // resume is invoked directly from the user's click, before any asynchronous work.
  await ctx.resume();if(version!==operation||document.hidden){ctx.close().catch(()=>{});return;}
  const selected=prefs.sound;let buffer;
  if(selected.startsWith('original-'))buffer=originalBuffer(ctx,selected);
  else if(recordings[selected]){
   if(decoded.has(selected))buffer=decoded.get(selected);
   else{
    const controller=new AbortController();download=controller;const timeout=setTimeout(()=>controller.abort(),20000);
    try{const response=await fetch(new URL(recordings[selected],document.baseURI),{signal:controller.signal});if(!response.ok)throw Error('audio-download');const bytes=await response.arrayBuffer();if(version!==operation)return;buffer=recordingHeadroom(await ctx.decodeAudioData(bytes));if(version!==operation)return;decoded.set(selected,buffer);while(decoded.size>2)decoded.delete(decoded.keys().next().value);}
    finally{clearTimeout(timeout);if(download===controller)download=null;}
   }
  }else throw Error('unknown-recording');
  let savedOffline=false;try{if(navigator.serviceWorker?.controller){const cache=await caches.open('av-AV-audio-v1');savedOffline=!!await cache.match(new URL(recordings[selected],document.baseURI),{ignoreSearch:true});}}catch{}
  if(version!==operation){ctx.close().catch(()=>{});return;}
  if(!savedOffline&&!selected.startsWith('original-'))message=ru()?'Играет запись. Офлайн-копия не подтверждена: хранилище недоступно или переполнено.':'Recording is playing. An offline copy is not confirmed: storage is unavailable or full.';
  master=ctx.createGain();master.gain.setValueAtTime(0,ctx.currentTime);master.connect(ctx.destination);
  source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(master);source.start();
  master.gain.setTargetAtTime(prefs.volume,ctx.currentTime,.12);playing=true;busy=false;
  ctx.onstatechange=()=>{if(context===ctx&&playing&&ctx.state!=='running')stop(ru()?'Звук приостановлен. Нажми «Включить».':'Sound paused. Press Play.');};
  labels();
 }catch(e){if(version===operation)stop(recordings[prefs.sound]?(ru()?'Не удалось включить запись. Для первой загрузки нужен интернет; попробуй ещё раз.':'Could not play the recording. First playback needs internet; please try again.'):(ru()?'Не удалось включить звук. Проверь звук устройства и попробуй ещё раз.':'Could not start audio. Check device sound and try again.'));}
}
function paint(){
 if(!panel)return;
 I24.text(panel.querySelector('#avAmbienceTitle'),()=>((ru()?I24.t("Музыка и атмосфера"):'Music and atmosphere')));
 I24.text(panel.querySelector('.av-ambience-intro'),()=>((ru()?I24.t("Звуки природы, атмосферные миксы, гитара и мини-треки. Узнаваемые песни — отдельно, через официальный плеер без скачивания."):'Real field recordings: Japanese trains and rain, forests and water. Locations are stated only when supported by the source.')));
 I24.text(panel.querySelector('#avAmbienceSelectLabel'),()=>((ru()?I24.t("Выбери звук"):'Choose a sound')));
 for(const option of panel.querySelectorAll('#avAmbienceSelect option')){const m=modes.find(x=>x[0]===option.value);I24.text(option,()=>((((m[1]+' ')+(ru()?m[2]:m[3]))+(groupFor(m[0])==='nature'?(ru()?I24.t(" · звук"):' · sound'):' · CC BY 4.0'))));}
 panel.querySelector('#avAmbienceSelect').value=prefs.sound;
 I24.text(panel.querySelector('#avAmbienceVolumeLabel'),()=>((ru()?I24.t("Громкость"):'Volume')));panel.querySelector('#avAmbienceVolume').value=String(Math.round(prefs.volume*100));panel.querySelector('output').textContent=Math.round(prefs.volume*100)+'%';
 const play=panel.querySelector('#avAmbiencePlay');play.disabled=false;play.setAttribute('aria-busy',String(busy));I24.text(play,()=>((busy?(ru()?I24.t("✕ Отменить загрузку"):'✕ Cancel loading'):(playing?(ru()?I24.t("⏸ Выключить"):'⏸ Stop'):(ru()?I24.t("▶ Включить"):'▶ Play')))));play.setAttribute('aria-pressed',String(playing));
 I24.text(panel.querySelector('#avAmbienceClose'),()=>((ru()?I24.t("Закрыть"):'Close')));
 I24.text(panel.querySelector('.av-ambience-note'),()=>((ru()?I24.t("Запись загружается при первом включении; офлайн доступна, если сохранена и браузер не очистил кэш. Звук включается только тобой. При обычных переходах внутри сайта плеер сохраняется. Перезагрузка, новая вкладка или ограничения телефона могут прервать звук. Для остановки нажми «Выключить»."):'Recordings download on first play; offline playback requires a retained cached copy. Audio starts only when you choose. Internal navigation preserves the player. Reloading, a new tab or operating-system restrictions may interrupt audio.')));
 paintLibrary();const credits=panel.querySelector('.av-audio-credits');if(credits)credits.hidden=true;
 I24.text(panel.querySelector('.av-ambience-status'),()=>((message||(playing?(prefs.volume===0?(ru()?I24.t("Включено, громкость 0%."):'Playing at 0% volume.'):((ru()?I24.t("Играет: "):'Playing: ')+(ru()?modes.find(m=>m[0]===prefs.sound)[2]:modes.find(m=>m[0]===prefs.sound)[3]))):(ru()?I24.t("Сейчас выключено"):'Currently off')))));
}

let audioTab='nature',sleepTimer=null,sleepMinutes=0,sleepDeadline=0;
const popular=[['anime','YOASOBI — Idol','ZRtdQ81jPUQ'],['anime','Ado — Show','pgXpM4l_MwI'],['edits','KORDHELL — Murder In My Mind','w-sQRS-Lc9k'],['romance','JVKE — golden hour','PEM0Vs8jf1w'],['romance','Laufey — From The Start','lSD_L-xic9o']];
function groupFor(id){return id.startsWith('original-')?'nature':id.startsWith('guitar-')?'guitar':['carefree','easy-lemon','piano-dreams','piano-culture','harp-evening'].includes(id)?'mini':'nature';}
function manualStop(){clearTimeout(sleepTimer);sleepTimer=null;sleepMinutes=0;sleepDeadline=0;const timer=panel?.querySelector('#m21Sleep');if(timer)timer.value='0';stop();}
function buildLibrary(){
 const tabs=document.createElement('nav');tabs.className='m21-audio-tabs';I24.attr(tabs,'aria-label',()=>(I24.t("Подборки музыки и атмосферы")));for(const[id,label]of [['nature','🌧 Природа']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.audioTab=id;b.onclick=()=>{audioTab=id;panel.querySelector('#m21Official')?.replaceChildren();paint();};tabs.append(b);}const library=document.createElement('div');library.id='m21AudioLibrary';const official=document.createElement('div');official.id='m21Official';const timerLabel=document.createElement('label');timerLabel.className='m21-sleep-label';I24.text(timerLabel,()=>(I24.t("Таймер сна ")));const select=document.createElement('select');select.id='m21Sleep';I24.attr(select,'aria-label',()=>(I24.t("Таймер сна")));for(const[v,text]of [[0,'Без таймера'],[15,'15 минут'],[30,'30 минут'],[60,'60 минут']]){const o=document.createElement('option');o.value=v;o.textContent=text;select.append(o);}select.value=String(sleepMinutes);select.onchange=()=>{clearTimeout(sleepTimer);const min=Number(select.value);sleepMinutes=min;sleepDeadline=min?Date.now()+min*60000:0;sleepTimer=min?setTimeout(()=>{sleepTimer=null;sleepMinutes=0;sleepDeadline=0;const field=panel?.querySelector('#m21Sleep');if(field)field.value='0';stop('Остановлено таймером сна.');},min*60000):null;};timerLabel.append(select);panel.querySelector('.av-ambience-intro').after(tabs,library,official);panel.querySelector('.av-ambience-actions').after(timerLabel);
}
function paintLibrary(){
 if(!panel)return;const library=panel.querySelector('#m21AudioLibrary');if(!library)return;panel.querySelectorAll('[data-audio-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.audioTab===audioTab)));library.replaceChildren();const hidden=audioTab==='popular';panel.querySelector('#avAmbienceSelect').hidden=hidden;panel.querySelector('#avAmbienceSelectLabel').hidden=hidden;panel.querySelector('.av-ambience-volume-heading').hidden=hidden;panel.querySelector('#avAmbienceVolume').hidden=hidden;panel.querySelector('#avAmbiencePlay').hidden=hidden;panel.querySelector('.m21-sleep-label').hidden=hidden;
 if(hidden){const note=document.createElement('p');note.className='m21-official-note';I24.text(note,()=>(I24.t("Узнаваемые треки, не текущий чарт. Официальный YouTube-плеер загрузится только по нажатию: площадка получит сетевой запрос, возможны реклама, возрастные и региональные ограничения. Музыка не скачивается; скрытого фонового режима нет.")));library.append(note);for(const[group,title,id]of popular){const card=document.createElement('article');card.className='m21-audio-card';const name=document.createElement('strong');name.textContent=title;const tag=document.createElement('small');I24.text(tag,()=>((group==='anime'?'ANIME / J-POP':(group==='edits'?'PHONK / EDITS':I24.t("РОМАНТИКА")))));const play=document.createElement('button');play.type='button';I24.text(play,()=>(I24.t("Загрузить официальный плеер")));play.onclick=()=>{manualStop();const host=panel.querySelector('#m21Official');host.replaceChildren();const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=0&playsinline=1';frame.title=(title+I24.t(" — официальный YouTube-плеер"));frame.allow='encrypted-media; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';host.append(frame);host.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};const link=document.createElement('a');link.href='https://www.youtube.com/watch?v='+id;link.target='_blank';link.rel='noopener noreferrer';I24.text(link,()=>(I24.t("Открыть на YouTube ↗")));card.append(tag,name,play,link);library.append(card);}return;}
 for(const m of originalModes){const b=document.createElement('button');b.className='m21-audio-card';b.type='button';b.setAttribute('aria-pressed',String(prefs.sound===m[0]));const title=document.createElement('strong');title.textContent=m[1]+' '+(ru()?m[2]:m[3]);const small=document.createElement('small');I24.text(small,()=>((audioTab==='nature'?(m[0].includes('window')||['rail-rain','river','distant-train'].includes(m[0])?I24.t("ОБРАБОТКА / МИКС ЗАПИСЕЙ"):I24.t("ПОЛЕВАЯ ЗАПИСЬ")):'KEVIN MACLEOD · CC BY 4.0')));b.append(title,small);b.onclick=()=>{prefs.sound=m[0];save();if(playing||busy)start();else paint();};library.append(b);}
}

function open(){
 if(panel){panel.close();return;}
 document.querySelector('.decor-menu')?.remove();invoker=button;panel=document.createElement('dialog');panel.className='av-ambience-panel';panel.id='avAmbiencePanel';panel.setAttribute('aria-labelledby','avAmbienceTitle');
 panel.innerHTML='<h2 id="avAmbienceTitle"></h2><p class="av-ambience-intro"></p><label id="avAmbienceSelectLabel" for="avAmbienceSelect"></label><select id="avAmbienceSelect"></select><div class="av-ambience-volume-heading"><label id="avAmbienceVolumeLabel" for="avAmbienceVolume"></label><output for="avAmbienceVolume"></output></div><input id="avAmbienceVolume" type="range" min="0" max="100" step="1"><p class="av-ambience-status" role="status" aria-live="polite"></p><div class="av-ambience-actions"><button type="button" class="primary" id="avAmbiencePlay"></button><button type="button" class="secondary" id="avAmbienceClose"></button></div><p class="av-ambience-note"></p><a class="av-audio-credits" href="audio-sources.html"></a>';
 for(const m of modes){const option=document.createElement('option');option.value=m[0];panel.querySelector('select').append(option);}
 panel.querySelector('#avAmbienceSelect').onchange=e=>{prefs.sound=e.target.value;save();if(playing||busy)start();else paint();};
 panel.querySelector('#avAmbienceVolume').oninput=e=>{prefs.volume=Number(e.target.value)/100;save();if(master&&context)master.gain.setTargetAtTime(prefs.volume,context.currentTime,.04);paint();};
 panel.querySelector('#avAmbiencePlay').onclick=()=>(playing||busy)?manualStop():start();
 panel.querySelector('#avAmbienceClose').onclick=()=>panel.close();
 panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
 panel.addEventListener('close',()=>{panel.remove();panel=null;button.setAttribute('aria-expanded','false');(invoker?.checkVisibility?.()?invoker:header.querySelector(".av-menu-toggle"))?.focus({preventScroll:true});});
 buildLibrary();paint();document.body.append(panel);button.setAttribute('aria-expanded','true');panel.showModal();
}
window.AVAmbience={stop:manualStop,active:()=>playing||busy,open,stopForMedia:()=>{clearTimeout(sleepTimer);sleepTimer=null;sleepMinutes=0;sleepDeadline=0;if(playing||busy)stop(ru()?'Фон выключен, чтобы не мешать видео.':'Ambience stopped for video.');},debug:()=>({playing,busy,operation,state:context?.state})};button.onclick=open;
new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
// Background playback remains active; the OS may still suspend audio.
addEventListener('pagehide',()=>stop());
document.addEventListener('play',e=>{if(e.target instanceof HTMLMediaElement&&!e.target.muted&&e.target.volume>0&&(playing||busy))stop(ru()?'Фон выключен, чтобы не мешать видео.':'Ambience stopped so it does not interfere with video.');},true);
addEventListener('storage',e=>{if(e.key===KEY){manualStop();read();labels();}});
matchMedia('(forced-colors: active)').addEventListener('change',()=>window.applyDecorFromStorage?.());
const motion=matchMedia('(prefers-reduced-motion: reduce)');motion.addEventListener('change',()=>{if(typeof window.applyDecorFromStorage==='function')window.applyDecorFromStorage();});
document.addEventListener('visibilitychange',()=>{if(typeof window.startDecor==='function'&&typeof window.applyDecorFromStorage==='function'){if(document.hidden)window.startDecor('off');else window.applyDecorFromStorage();}});
// Bound the longer existing effects menu to the visual viewport, including a phone keyboard.
let decorFrame=0;
function placeDecor(){decorFrame=0;const menu=document.querySelector('.decor-menu');if(!menu)return;const v=visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,w=v?.width||innerWidth,h=v?.height||innerHeight,rect=document.getElementById('decorToggle')?.getBoundingClientRect();menu.style.width=Math.min(220,w-24)+'px';menu.style.minWidth='0';menu.style.maxHeight=Math.max(1,h-24)+'px';const height=Math.min(menu.scrollHeight+2,h-24);menu.style.top=Math.max(top+12,Math.min(rect?rect.bottom+8:top+12,top+h-height-12))+'px';menu.style.left=Math.max(left+12,Math.min(rect?rect.right-220:left+12,left+w-Math.min(220,w-24)-12))+'px';menu.style.right='auto';}
function decorPosition(){if(!decorFrame)decorFrame=requestAnimationFrame(placeDecor);}
new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&n.matches?.('.decor-menu'))))decorPosition();}).observe(document.body,{childList:true});
addEventListener('resize',decorPosition);window.visualViewport?.addEventListener('resize',decorPosition);window.visualViewport?.addEventListener('scroll',decorPosition);
labels();
})();
