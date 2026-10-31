/* ANIME VOID v18 — seven attributed real field recordings; no synthesis, autoplay or microphone. */
(()=>{'use strict';
const KEY='animeVoidAmbience',modes=[['train','🚆','Поезд · линия Дзёбан','Train · Joban Line'],['hokkaido','🚃','Поезд · Хоккайдо','Train · Hokkaido'],['japan-rain','🌧️','Дождь · Япония','Rain · Japan'],['rain-wind','🌬️','Дождь и ветер · Лондон','Rain and wind · London'],['stream','💧','Ручей рядом','Nearby stream'],['night-forest','🌲','Ночной лес · Мёдлинг','Night forest · Mödling'],['forest-water','🏞️','Лесной ручей · Канада','Forest stream · Canada']];
const recordings=Object.fromEntries(modes.map(m=>[m[0],'audio/'+m[0]+'-v18.mp3']));
const decoded=new Map();let download=null;
function recordingHeadroom(buffer){
 let peak=0;
 for(let c=0;c<buffer.numberOfChannels;c++){const a=buffer.getChannelData(c);for(let i=0;i<a.length;i++)peak=Math.max(peak,Math.abs(a[i]));}
 if(!Number.isFinite(peak)||!peak)throw Error('Invalid audio signal');
 if(peak>.85){const gain=.85/peak;for(let c=0;c<buffer.numberOfChannels;c++){const a=buffer.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=gain;}}
 return buffer;
}
const ru=()=>document.documentElement.lang!=='en';
let prefs={sound:'train',volume:.25};
function read(){prefs={sound:'train',volume:.25};try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Number.isFinite(v.volume)&&v.volume>=0&&v.volume<=1)prefs={sound:modes.some(m=>m[0]===v.sound)?v.sound:'train',volume:v.volume};}catch(e){}}
read();let context=null,source=null,master=null,playing=false,panel=null,invoker=null,operation=0,message='',busy=false;
const header=document.querySelector('header');if(!header)return;
const button=document.createElement('button');button.id='avAmbienceToggle';button.className='theme-toggle av-ambience-toggle';button.type='button';button.textContent='🎧';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
(document.body.classList.contains('av-home')?header:(header.querySelector('.header-actions')||header)).append(button);
function labels(){button.title=ru()?'Звуки для отдыха':'Relaxing sounds';button.setAttribute('aria-label',(ru()?'Звуки для отдыха':'Relaxing sounds')+(playing?(ru()?' — включены':' — playing'):''));button.classList.toggle('is-playing',playing);if(panel)paint();}
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
 stop();const version=++operation;busy=true;message='';paint();
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unsupported');
  const ctx=new Audio();context=ctx;
  // resume is invoked directly from the user's click, before any asynchronous work.
  await ctx.resume();if(version!==operation||document.hidden){ctx.close().catch(()=>{});return;}
  const selected=prefs.sound;let buffer;
  if(recordings[selected]){
   if(decoded.has(selected))buffer=decoded.get(selected);
   else{
    const controller=new AbortController();download=controller;const timeout=setTimeout(()=>controller.abort(),20000);
    try{const response=await fetch(new URL(recordings[selected],document.baseURI),{signal:controller.signal});if(!response.ok)throw Error('audio-download');const bytes=await response.arrayBuffer();if(version!==operation)return;buffer=recordingHeadroom(await ctx.decodeAudioData(bytes));if(version!==operation)return;decoded.set(selected,buffer);while(decoded.size>2)decoded.delete(decoded.keys().next().value);}
    finally{clearTimeout(timeout);if(download===controller)download=null;}
   }
  }else throw Error('unknown-recording');
  let savedOffline=false;try{if(navigator.serviceWorker?.controller){const cache=await caches.open('av-AV-audio-v1');savedOffline=!!await cache.match(new URL(recordings[selected],document.baseURI),{ignoreSearch:true});}}catch{}
  if(version!==operation){ctx.close().catch(()=>{});return;}
  if(!savedOffline)message=ru()?'Играет запись. Офлайн-копия не подтверждена: хранилище недоступно или переполнено.':'Recording is playing. An offline copy is not confirmed: storage is unavailable or full.';
  master=ctx.createGain();master.gain.setValueAtTime(0,ctx.currentTime);master.connect(ctx.destination);
  source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(master);source.start();
  master.gain.setTargetAtTime(prefs.volume,ctx.currentTime,.12);playing=true;busy=false;
  ctx.onstatechange=()=>{if(context===ctx&&playing&&ctx.state!=='running')stop(ru()?'Звук приостановлен. Нажми «Включить».':'Sound paused. Press Play.');};
  labels();
 }catch(e){if(version===operation)stop(recordings[prefs.sound]?(ru()?'Не удалось включить запись. Для первой загрузки нужен интернет; попробуй ещё раз.':'Could not play the recording. First playback needs internet; please try again.'):(ru()?'Не удалось включить звук. Проверь звук устройства и попробуй ещё раз.':'Could not start audio. Check device sound and try again.'));}
}
function paint(){
 if(!panel)return;
 panel.querySelector('#avAmbienceTitle').textContent=ru()?'Атмосфера для отдыха':'Relaxing atmosphere';
 panel.querySelector('.av-ambience-intro').textContent=ru()?'Настоящие полевые записи: японские поезда и дождь, лес и вода. География указана только там, где её подтверждает источник.':'Real field recordings: Japanese trains and rain, forests and water. Locations are stated only when supported by the source.';
 panel.querySelector('#avAmbienceSelectLabel').textContent=ru()?'Выбери звук':'Choose a sound';
 for(const option of panel.querySelectorAll('option')){const m=modes.find(x=>x[0]===option.value);option.textContent=m[1]+' '+(ru()?m[2]:m[3])+(recordings[m[0]]?(ru()?' · запись':' · recording'):(ru()?' · синтез':' · synthesized'));}
 panel.querySelector('#avAmbienceSelect').value=prefs.sound;
 panel.querySelector('#avAmbienceVolumeLabel').textContent=ru()?'Громкость':'Volume';panel.querySelector('#avAmbienceVolume').value=String(Math.round(prefs.volume*100));panel.querySelector('output').textContent=Math.round(prefs.volume*100)+'%';
 const play=panel.querySelector('#avAmbiencePlay');play.disabled=false;play.setAttribute('aria-busy',String(busy));play.textContent=busy?(ru()?'✕ Отменить загрузку':'✕ Cancel loading'):playing?(ru()?'⏸ Выключить':'⏸ Stop'):(ru()?'▶ Включить':'▶ Play');play.setAttribute('aria-pressed',String(playing));
 panel.querySelector('#avAmbienceClose').textContent=ru()?'Закрыть':'Close';
 panel.querySelector('.av-ambience-note').textContent=ru()?'Запись загружается при первом включении; офлайн доступна, если сохранена и браузер не очистил кэш. Звук включается только тобой. При переходе на другую страницу или сворачивании он останавливается — запусти снова, когда захочешь.':'Recordings download on first play; offline playback requires a retained cached copy. Audio starts only when you choose. Navigation or hiding the app stops playback; press Play again whenever you want.';
 const credits=panel.querySelector('.av-audio-credits');credits.textContent=ru()?'Источники и лицензии записей':'Recording sources and licenses';credits.href='audio-sources.html'+(recordings[prefs.sound]?'#'+prefs.sound:'');
 panel.querySelector('.av-ambience-status').textContent=message||(playing?(prefs.volume===0?(ru()?'Включено, громкость 0%.':'Playing at 0% volume.'):(ru()?'Играет: ':'Playing: ')+(ru()?modes.find(m=>m[0]===prefs.sound)[2]:modes.find(m=>m[0]===prefs.sound)[3])):(ru()?'Сейчас выключено':'Currently off'));
}
function open(){
 if(panel){panel.close();return;}
 document.querySelector('.decor-menu')?.remove();invoker=button;panel=document.createElement('dialog');panel.className='av-ambience-panel';panel.id='avAmbiencePanel';panel.setAttribute('aria-labelledby','avAmbienceTitle');
 panel.innerHTML='<h2 id="avAmbienceTitle"></h2><p class="av-ambience-intro"></p><label id="avAmbienceSelectLabel" for="avAmbienceSelect"></label><select id="avAmbienceSelect"></select><div class="av-ambience-volume-heading"><label id="avAmbienceVolumeLabel" for="avAmbienceVolume"></label><output for="avAmbienceVolume"></output></div><input id="avAmbienceVolume" type="range" min="0" max="100" step="1"><p class="av-ambience-status" role="status" aria-live="polite"></p><div class="av-ambience-actions"><button type="button" class="primary" id="avAmbiencePlay"></button><button type="button" class="secondary" id="avAmbienceClose"></button></div><p class="av-ambience-note"></p><a class="av-audio-credits" href="audio-sources.html"></a>';
 for(const m of modes){const option=document.createElement('option');option.value=m[0];panel.querySelector('select').append(option);}
 panel.querySelector('select').onchange=e=>{prefs.sound=e.target.value;save();if(playing||busy)start();else paint();};
 panel.querySelector('input').oninput=e=>{prefs.volume=Number(e.target.value)/100;save();if(master&&context)master.gain.setTargetAtTime(prefs.volume,context.currentTime,.04);paint();};
 panel.querySelector('#avAmbiencePlay').onclick=()=>(playing||busy)?stop():start();
 panel.querySelector('#avAmbienceClose').onclick=()=>panel.close();
 panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
 panel.addEventListener('close',()=>{panel.remove();panel=null;button.setAttribute('aria-expanded','false');(invoker?.checkVisibility?.()?invoker:header.querySelector(".av-menu-toggle"))?.focus({preventScroll:true});});
 paint();document.body.append(panel);button.setAttribute('aria-expanded','true');panel.showModal();
}
button.onclick=open;
new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(playing||busy))stop();});
addEventListener('pagehide',()=>stop());
document.addEventListener('play',e=>{if(e.target instanceof HTMLMediaElement&&(playing||busy))stop(ru()?'Фон выключен, чтобы не мешать видео.':'Ambience stopped so it does not interfere with video.');},true);
addEventListener('storage',e=>{if(e.key===KEY){stop();read();labels();}});
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
