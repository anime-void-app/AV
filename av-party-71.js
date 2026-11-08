/* ANIME VOID 71.0 — resilient authenticated watch parties, ephemeral chat and opt-in WebRTC.
   No video retransmission, no recording, no privileges granted by client payload. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const ui={
 lobby:$('partyLobby'),session:$('partySession'),status:$('partyStatus'),create:$('partyCreate'),anime:$('partyAnimeId'),
 roomName:$('partyRoomName'),count:$('partyMemberCount'),copy:$('partyCopy'),leave:$('partyLeave'),
 frame:$('partyFrame'),prev:$('partyPrev'),next:$('partyNext'),episode:$('partyEpisodeLabel'),
 sync:$('partySync'),syncInfo:$('partySyncInfo'),chatTab:$('partyChatTab'),voiceTab:$('partyVoiceTab'),
 chatPane:$('partyChatPane'),voicePane:$('partyVoicePane'),messages:$('partyMessages'),
 chatForm:$('partyChatForm'),input:$('partyChatInput'),online:$('partyOnline'),people:$('partyPeople'),
 mic:$('partyMic'),mute:$('partyMute'),voiceState:$('partyVoiceState'),audio:$('partyRemoteAudio'),
 playerStatus:$('partyPlayerStatus'),reconnect:$('partyReconnect'),sound:$('partySound'),voiceRetry:$('partyVoiceRetry')
};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ANIME=/^anilist-[1-9][0-9]{0,9}$/;
const client=()=>window.AVAccount?.client?.();
let sb=null,user=null,room=null,roomId=null,channel=null,connected=false,active=false;
let localStream=null,micEnabled=false,micMuted=false,applying=false,playerVideo=null;
let latestPublished=0,busy=false,lastChatAt=0,heartbeat=null,peers=new Map();
let videoProbeTimer=null,publishInFlight=false,chatSending=false;
const clock=()=>new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
function status(message,error=false){ui.status.textContent=message;ui.status.dataset.error=String(error);}
function label(id){return id===user?.id?'Ты':'Зритель '+String(id||'').slice(-4);}
function roomURL(id){const u=new URL('party.html',location.href);u.searchParams.set('room',id);return u.href;}
function episodeURL(){const u=new URL('watch.html',location.href);u.searchParams.set('id',room.anime_id);u.searchParams.set('episode',String(room.episode));u.searchParams.set('party','1');return u.href;}
function showTab(which){const voice=which==='voice';ui.chatPane.hidden=voice;ui.voicePane.hidden=!voice;ui.chatTab.setAttribute('aria-selected',String(!voice));ui.voiceTab.setAttribute('aria-selected',String(voice));}
ui.chatTab.addEventListener('click',()=>showTab('chat'));
ui.voiceTab.addEventListener('click',()=>showTab('voice'));
function setHostUI(){
 const host=room?.host_id===user?.id;
 for(const b of [ui.prev,ui.next])b.disabled=!host||busy;
 ui.sync.disabled=!room||busy;
 ui.episode.textContent='Серия '+(room?.episode||1);
 ui.roomName.textContent='Аниме '+String(room?.anime_id||'').replace('anilist-','#');
 ui.syncInfo.textContent=host?'Ты управляешь общим просмотром':'Управляет создатель комнаты';
 ui.count.textContent=host?'Ты создатель комнаты':'Ты участник комнаты';
}
function player(){
 try{return ui.frame.contentWindow?.AVPlayer?.getPlayer?.()||null;}catch{return null;}
}
function watchFrame(force=false){
 if(!room)return;
 const url=episodeURL();
 if(force||ui.frame.src!==url){
  detachVideo();
  ui.frame.src=url;
 }
}
function detachVideo(){
 if(videoProbeTimer){clearInterval(videoProbeTimer);videoProbeTimer=null;}
 if(playerVideo){
  for(const ev of ['playing','pause','seeked'])playerVideo.removeEventListener(ev,onPlaybackChange);
  playerVideo=null;
 }
}
function onPlaybackChange(){
 if(applying||!room||room.host_id!==user?.id||!connected)return;
 void publishPlayback(false);
}
async function publishPlayback(force){
 if(!room||room.host_id!==user?.id||!connected||publishInFlight)return;
 const v=playerVideo;
 if(!v||!Number.isFinite(v.currentTime)||v.hidden||!v.currentSrc)return;
 if(!force&&Date.now()-latestPublished<350)return;
 latestPublished=Date.now();
 const expectedRoom=roomId,expectedEpisode=room.episode;
 const progress=Math.max(0,Math.min(43200,Math.round(v.currentTime*100)/100));
 const play=!v.paused&&!v.ended;
 publishInFlight=true;
 try{
  const {data,error}=await sb.from('av_watch_party_rooms')
   .update({playhead:progress,is_playing:play,updated_at:new Date().toISOString()})
   .eq('id',expectedRoom).eq('host_id',user.id).eq('episode',expectedEpisode)
   .select('id,playhead,is_playing,episode,updated_at').maybeSingle();
  if(error)throw error;
  if(!data||roomId!==expectedRoom||room?.episode!==expectedEpisode)return;
  room={...room,...data};
  await send('changed',{room:expectedRoom});
 }catch(e){if(active)status('Ошибка синхронизации: '+e.message,true);}
 finally{publishInFlight=false;}
}
function attachVideo(){
 const p=player();
 if(!p||p.tagName!=='VIDEO'||p.hidden||(!p.currentSrc&&!p.src))return false;
 if(playerVideo===p)return true;
 if(playerVideo){
  for(const ev of ['playing','pause','seeked'])playerVideo.removeEventListener(ev,onPlaybackChange);
 }
 playerVideo=p;
 ui.playerStatus.textContent='HTML5 · '+(room.host_id===user.id?
  'пауза и позиция передаются друзьям':'пауза и позиция синхронизируются с ведущим');
 if(room.host_id===user.id){
  for(const ev of ['playing','pause','seeked'])p.addEventListener(ev,onPlaybackChange);
 }else void applyPlayback();
 return true;
}

async function applyPlayback(){
 if(!room||room.host_id===user?.id)return;
 const p=playerVideo;
 if(!p||!Number.isFinite(p.duration)||p.duration<=0)return;
 applying=true;
 try{
  const target=Number(room.playhead)||0;
  if(Math.abs(p.currentTime-target)>3)try{p.currentTime=Math.max(0,Math.min(target,p.duration-1));}catch{}
  if(room.is_playing&&p.paused){
   try{await p.play();}catch{ui.syncInfo.textContent='Нажми ▶ в плеере, чтобы разрешить звук';}
  }else if(!room.is_playing&&!p.paused)p.pause();
 }finally{applying=false;}
}
ui.frame.addEventListener('load',()=>{
 if(!room||!active)return;
 const expectedURL=ui.frame.src;
 let attempts=0;
 const probe=()=>{
  if(!room||!active||ui.frame.src!==expectedURL){
   if(videoProbeTimer){clearInterval(videoProbeTimer);videoProbeTimer=null;}return;
  }
  if(attachVideo()){
   if(videoProbeTimer){clearInterval(videoProbeTimer);videoProbeTimer=null;}
   const p=playerVideo;
   if(p&&room.host_id!==user.id){
    if(p.readyState>=1)void applyPlayback();
    else p.addEventListener('loadedmetadata',()=>void applyPlayback(),{once:true});
   }
   return;
  }
  let providerManaged=false;
  try{providerManaged=ui.frame.contentWindow?.AVPlayer?.state?.()?.providerManaged===true;}catch{}
  if(providerManaged){
   ui.playerStatus.textContent='Kodik · синхронизируется серия, но не пауза и перемотка';
   if(videoProbeTimer){clearInterval(videoProbeTimer);videoProbeTimer=null;}
   return;
  }
  if(++attempts>=25){
   ui.playerStatus.textContent='Видео не подключено или плеер недоступен для управления';
   if(videoProbeTimer){clearInterval(videoProbeTimer);videoProbeTimer=null;}
  }
 };
 ui.playerStatus.textContent='Проверяем подключение видео…';
 probe();
 if(attempts>0&&attempts<25&&!videoProbeTimer)videoProbeTimer=setInterval(probe,400);
});

async function fetchRoom(update=true){
 if(!roomId||!sb)return null;
 const requestedRoom=roomId;
 const {data,error}=await sb.from('av_watch_party_rooms')
  .select('id,host_id,anime_id,episode,playhead,is_playing,updated_at').eq('id',requestedRoom).maybeSingle();
 if(roomId!==requestedRoom)return null;
 if(error){error.roomId=requestedRoom;throw error;}
 if(!data){const issue=Error('Комната завершена или больше недоступна.');issue.code='AV_ROOM_CLOSED';issue.roomId=requestedRoom;throw issue;}
 if(update){
  const changed=room?.anime_id!==data.anime_id||room?.episode!==data.episode;
  room=data;
  setHostUI();
  if(changed)watchFrame(true);
  else if(room.host_id!==user.id)void applyPlayback();
 }
 return data;
}
async function changeEpisode(step){
 if(busy||!room||room.host_id!==user.id)return;
 const to=room.episode+step;
 if(to<1||to>10000)return;
 busy=true;setHostUI();
 try{
  const {data,error}=await sb.from('av_watch_party_rooms').update({
    episode:to,playhead:0,is_playing:false,updated_at:new Date().toISOString()
  }).eq('id',roomId).eq('host_id',user.id)
   .select('id,host_id,anime_id,episode,playhead,is_playing,updated_at').single();
  if(error)throw error;
  room=data;watchFrame(true);await send('changed',{room:roomId});
 }catch(e){status('Нельзя сменить серию: '+e.message,true);}
 finally{busy=false;setHostUI();}
}
ui.prev.onclick=()=>void changeEpisode(-1);
ui.next.onclick=()=>void changeEpisode(1);
ui.sync.onclick=async()=>{try{await fetchRoom(true);status('Серия и состояние комнаты обновлены.');}catch(e){await handleRoomError(e);}};
ui.copy.onclick=async()=>{
 try{await navigator.clipboard.writeText(roomURL(roomId));status('Ссылка приглашения скопирована.');}
 catch{window.prompt('Скопируй ссылку на комнату:',roomURL(roomId));}
};
async function send(event,payload){
 if(!connected||!channel)return false;
 try{
  const state=await channel.send({type:'broadcast',event,payload});
  if(state!=='ok'&&state?.status!=='ok')throw Error('Сервер не подтвердил отправку ('+String(state)+')');
  return true;
 }catch(e){if(active)status('Нет связи с комнатой: '+e.message,true);return false;}
}

function addChat({from,body,time}){
 if(typeof body!=='string'||!body.trim()||body.length>500||!UUID.test(from))return;
 if(ui.messages.querySelector('.party-empty'))ui.messages.replaceChildren();
 const wrap=document.createElement('article');wrap.className='party-msg';
 const avatar=document.createElement('div');avatar.className='party-avatar';avatar.textContent=(from===user.id?'Я':from.slice(-2)).toUpperCase();
 const content=document.createElement('div');content.className='party-msg-main';
 const head=document.createElement('div');head.className='party-msg-by';
 const author=document.createElement('strong');author.textContent=label(from);
 const stamp=document.createElement('time');stamp.textContent=typeof time==='string'?time.slice(0,5):clock();
 head.append(author,stamp);
 const message=document.createElement('div');message.className='party-msg-text';message.textContent=body;
 content.append(head,message);wrap.append(avatar,content);ui.messages.append(wrap);
 while(ui.messages.children.length>100)ui.messages.firstElementChild.remove();
 ui.messages.scrollTop=ui.messages.scrollHeight;
}
ui.chatForm.addEventListener('submit',e=>{e.preventDefault();void submitChat();});
async function submitChat(){
 if(!connected||chatSending)return;
 const body=ui.input.value.trim().slice(0,500);
 if(!body)return;
 if(Date.now()-lastChatAt<1000){status('Пиши чуть медленнее.');return;}
 lastChatAt=Date.now();
 chatSending=true;ui.input.disabled=true;
 const msg={from:user.id,body,time:clock()};
 try{
  if(await send('chat',msg)){
   addChat(msg);
   if(ui.input.value.trim()===body)ui.input.value='';
  }else status('Сообщение не отправлено. Повтори после восстановления связи.',true);
 }finally{chatSending=false;ui.input.disabled=false;ui.input.focus();}
}

function present(){
 const raw=channel?.presenceState?.()||{},list=[];
 for(const [key,states] of Object.entries(raw)){
  if(!UUID.test(key)||!Array.isArray(states)||!states.length)continue;
  list.push({id:key,voice:states.some(s=>s.voice===true)});
 }
 return list.sort((a,b)=>a.id.localeCompare(b.id));
}
async function track(){if(!connected||!channel)return;try{await channel.track({voice:micEnabled,mute:micMuted});}catch(e){status('Не удалось обновить участников: '+e.message,true);}}
function drawPeers(){
 const users=present();ui.online.textContent=users.length+' онлайн';
 ui.people.replaceChildren();
 for(const person of users){
  const item=document.createElement('span');item.className='party-person';
  item.textContent=label(person.id)+(person.id===room.host_id?' · Создатель':'')+(person.voice?' · 🎙':'');
  ui.people.append(item);
 }
 void reconcilePeers(users);
}
function cleanupPeer(id){
 const p=peers.get(id);if(!p)return;
 peers.delete(id);
 try{p.connection.close();}catch{}
 try{p.audio.remove();}catch{}
}
function cleanupVoice(){
 for(const id of [...peers.keys()])cleanupPeer(id);
 if(localStream){for(const track of localStream.getTracks())track.stop();localStream=null;}
 micEnabled=false;micMuted=false;ui.mic.textContent='Включить микрофон';ui.mic.setAttribute('aria-pressed','false');ui.mute.disabled=true;ui.mute.setAttribute('aria-pressed','false');
 ui.mute.textContent='Выключить звук микрофона';ui.voiceState.textContent='Микрофон выключен';
}
async function reconcilePeers(users){
 const voiceUsers=users.filter(p=>p.voice).slice(0,4);
 const eligible=new Set(voiceUsers.map(p=>p.id));
 for(const id of [...peers.keys()])if(!eligible.has(id)||!micEnabled)cleanupPeer(id);
 if(!micEnabled||!eligible.has(user.id))return;
 for(const p of voiceUsers){
  if(p.id===user.id||peers.has(p.id))continue;
  const peer=createPeer(p.id);
  if(user.id.localeCompare(p.id)<0){
   try{
    const offer=await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);
    await send('signal',{from:user.id,to:p.id,description:peer.connection.localDescription});
   }catch(e){status('Голосовое подключение: '+e.message,true);cleanupPeer(p.id);}
  }
 }
}
function createPeer(id){
 if(peers.has(id))return peers.get(id);
 const connection=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
 const audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;
 ui.audio.append(audio);
 const item={connection,audio,candidates:[]};peers.set(id,item);
 if(localStream)for(const track of localStream.getAudioTracks())connection.addTrack(track,localStream);
 connection.ontrack=e=>{
  audio.srcObject=e.streams[0];
  audio.play().catch(()=>{ui.voiceState.textContent='Нажми на страницу и включи звук, если браузер блокирует воспроизведение.';});
 };
 connection.onicecandidate=e=>{if(e.candidate)void send('signal',{from:user.id,to:id,candidate:e.candidate.toJSON()});};
 connection.onconnectionstatechange=()=>{
  if(connection.connectionState==='connected')ui.voiceState.textContent='Голосовая связь установлена.';
  if(connection.connectionState==='failed')ui.voiceState.textContent='Связь с одним из участников не установлена. Может потребоваться TURN.';
 };
 return item;
}
async function handleSignal(payload){
 if(!micEnabled||!payload||payload.to!==user.id||!UUID.test(payload.from))return;
 if(!present().some(p=>p.id===payload.from&&p.voice))return;
 let item=peers.get(payload.from);
 if(!item)item=createPeer(payload.from);
 const pc=item.connection;
 try{
  if(payload.description){
   const desc=payload.description;
   if(!['offer','answer'].includes(desc.type)||typeof desc.sdp!=='string'||desc.sdp.length>250000)return;
   if(desc.type==='offer'&&pc.signalingState!=='stable')return;
   await pc.setRemoteDescription(desc);
   for(const c of item.candidates.splice(0))await pc.addIceCandidate(c);
   if(desc.type==='offer'){
    const answer=await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await send('signal',{from:user.id,to:payload.from,description:pc.localDescription});
   }
  }else if(payload.candidate){
   const c=payload.candidate;
   if(typeof c.candidate!=='string'||c.candidate.length>4096)return;
   if(pc.remoteDescription)await pc.addIceCandidate(c);
   else if(item.candidates.length<24)item.candidates.push(c);
  }
 }catch(e){status('Ошибка голосового соединения: '+e.message,true);}
}
ui.mic.onclick=async()=>{
 if(micEnabled){cleanupVoice();await track();drawPeers();return;}
 if(present().filter(p=>p.voice).length>=4){
  ui.voiceState.textContent='Голосовая комната заполнена (до 4 участников).';return;
 }
 if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){
  ui.voiceState.textContent='Этот браузер не поддерживает микрофон/WebRTC.';return;
 }
 try{
  localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  micEnabled=true;micMuted=false;
  ui.mic.textContent='Отключить микрофон';ui.mic.setAttribute('aria-pressed','true');
  ui.mute.disabled=false;
  ui.voiceState.textContent='Микрофон включён. Другие участники подключаются автоматически.';
  await track();drawPeers();
 }catch(e){ui.voiceState.textContent='Доступ к микрофону не получен: '+e.message;cleanupVoice();}
};
ui.mute.onclick=()=>{
 if(!micEnabled||!localStream)return;
 micMuted=!micMuted;
 for(const track of localStream.getAudioTracks())track.enabled=!micMuted;
 ui.mute.textContent=micMuted?'Включить звук микрофона':'Выключить звук микрофона';
 ui.voiceState.textContent=micMuted?'Микрофон заглушён':'Микрофон включён';
 ui.mute.setAttribute('aria-pressed',String(micMuted));
 void track();
};
ui.sound.onclick=async()=>{
 let count=0;
 for(const item of peers.values()){
  try{await item.audio.play();count++;}catch{}
 }
 ui.voiceState.textContent=count?
  'Звук друзей включён ('+count+').':
  'Пока нет аудиопотоков. Проверь, включён ли микрофон у друга.';
};
ui.voiceRetry.onclick=()=>{
 if(!micEnabled){ui.voiceState.textContent='Сначала включи микрофон.';return;}
 for(const id of [...peers.keys()])cleanupPeer(id);
 void send('voice-reset',{from:user.id});
 void reconcilePeers(present());
 ui.voiceState.textContent='Пытаемся восстановить голосовую связь…';
};
async function subscribe(){
 const session=await sb.auth.getSession();
 if(!session.data.session?.access_token)throw Error('Для комнаты нужно войти в аккаунт.');
 if(heartbeat){clearInterval(heartbeat);heartbeat=null;}
 connected=false;
 await sb.realtime.setAuth(session.data.session.access_token);
 channel=sb.channel('av-party:'+roomId,{config:{private:true,presence:{key:user.id}}});
 const subscribedChannel=channel;
 channel
  .on('broadcast',{event:'chat'},({payload})=>{
   if(channel!==subscribedChannel||!active)return;
   if(payload&&payload.from!==user.id&&present().some(x=>x.id===payload.from))addChat(payload);
  })
  .on('broadcast',{event:'changed'},()=>{void fetchRoom(true).catch(handleRoomError);})
  .on('broadcast',{event:'signal'},({payload})=>{void handleSignal(payload);})
  .on('broadcast',{event:'voice-reset'},({payload})=>{
   if(!micEnabled||!UUID.test(payload?.from)||payload.from===user.id)return;
   cleanupPeer(payload.from);
   void reconcilePeers(present());
  })
  .on('presence',{event:'sync'},drawPeers)
  .subscribe(state=>{
   if(!active||channel!==subscribedChannel)return;
   if(state==='SUBSCRIBED'){
    connected=true;
    ui.reconnect.disabled=false;
    status('Комната подключена. Пригласи друзей по ссылке.');
    void track();drawPeers();
   }else if(state==='CHANNEL_ERROR'||state==='TIMED_OUT'||state==='CLOSED'){
    connected=false;
    status('Связь с комнатой прервана. Нажми «Переподключиться».',true);
   }
  });
 heartbeat=setInterval(()=>{
  if(!active||!room)return;
  void (async()=>{
   try{
    await fetchRoom(true);
    if(room?.host_id===user.id&&playerVideo&&!playerVideo.paused)await publishPlayback(true);
   }catch(e){await handleRoomError(e);}
  })();
 },8500);
}
async function closeLocal(message,failed=false){
 if(!active&&!roomId)return;
 active=false;connected=false;
 cleanupVoice();clearInterval(heartbeat);heartbeat=null;
 detachVideo();
 const wasChannel=channel;channel=null;
 if(wasChannel&&sb)try{await sb.removeChannel(wasChannel);}catch{}
 roomId=null;room=null;publishInFlight=false;
 ui.frame.removeAttribute('src');
 ui.session.hidden=true;ui.lobby.hidden=false;
 document.body.classList.remove('party-in-room');
 ui.messages.replaceChildren();
 const empty=document.createElement('p');empty.className='party-empty';
 empty.textContent='Начни разговор — сообщения видны тем, кто сейчас в комнате.';
 ui.messages.append(empty);
 ui.input.value='';ui.input.disabled=false;
 ui.online.textContent='0 онлайн';ui.people.replaceChildren();
 ui.playerStatus.textContent='Ожидание подключения';
 const u=new URL(location.href);u.searchParams.delete('room');history.replaceState(null,'',u);
 status(message,failed);
}
async function handleRoomError(error){
 if(error?.roomId&&error.roomId!==roomId)return;
 if(error?.code==='AV_ROOM_CLOSED'){
  await closeLocal('Комната завершена её создателем или больше не существует.',true);
 }else if(active){
  status('Не удалось обновить комнату: '+String(error?.message||error),true);
 }
}
ui.reconnect.onclick=async()=>{
 if(!active||!roomId)return;
 ui.reconnect.disabled=true;
 try{
  const old=channel;channel=null;connected=false;
  if(old)try{await sb.removeChannel(old);}catch{}
  for(const id of [...peers.keys()])cleanupPeer(id);
  await fetchRoom(true);
  await subscribe();
  status('Восстанавливаем соединение с комнатой…');
 }catch(e){await handleRoomError(e);}
 finally{ui.reconnect.disabled=false;}
};

async function join(id,created=false){
 if(!UUID.test(id))throw Error('Неверная ссылка комнаты.');
 const previousRoom=roomId;
 roomId=id;
 let wasInserted=false;
 try{
  const {error:memberError}=await sb.from('av_watch_party_members').insert({room_id:id,user_id:user.id});
  if(memberError&&memberError.code!=='23505')throw memberError;
  wasInserted=!memberError;
  const data=await fetchRoom(false);
  if(!data)throw Error('Комната больше не доступна.');
  room=data;active=true;
  ui.lobby.hidden=true;ui.session.hidden=false;
  document.body.classList.add('party-in-room');
  setHostUI();watchFrame(true);
  const u=new URL(location.href);u.searchParams.set('room',id);u.searchParams.delete('anime');
  history.replaceState(null,'',u);
  await subscribe();
  if(created)status('Комната создана! Скопируй приглашение и отправь друзьям.');
 }catch(e){
  if(wasInserted)try{await sb.from('av_watch_party_members').delete().eq('room_id',id).eq('user_id',user.id);}catch{}
  if(channel)try{await sb.removeChannel(channel);}catch{}
  clearInterval(heartbeat);heartbeat=null;channel=null;connected=false;active=false;
  room=null;roomId=previousRoom;
  ui.session.hidden=true;ui.lobby.hidden=false;
  document.body.classList.remove('party-in-room');
  detachVideo();ui.frame.removeAttribute('src');
  throw e;
 }
}

ui.create.onclick=async()=>{
 if(busy||!user)return;
 const digits=ui.anime.value.trim().replace(/^anilist-/,'');
 const anime='anilist-'+digits;
 if(!ANIME.test(anime)){status('Укажи правильный числовой Anime ID (например, 4224).',true);return;}
 busy=true;ui.create.disabled=true;
 try{
  const {data,error}=await sb.from('av_watch_party_rooms')
   .insert({host_id:user.id,anime_id:anime}).select('id').single();
  if(error)throw error;
  try{await join(data.id,true);}
  catch(joinError){
   try{await sb.from('av_watch_party_rooms').delete().eq('id',data.id).eq('host_id',user.id);}catch{}
   throw joinError;
  }
 }catch(e){status('Не удалось создать комнату: '+e.message,true);}
 finally{busy=false;ui.create.disabled=false;}
};
async function leave(){
 if(!roomId||!sb)return;
 const leaving=roomId;
 if(room?.host_id===user?.id){
  const {error}=await sb.from('av_watch_party_rooms').delete().eq('id',leaving).eq('host_id',user.id);
  if(error)throw error;
 }else{
  const {error}=await sb.from('av_watch_party_members').delete().eq('room_id',leaving).eq('user_id',user.id);
  if(error)throw error;
 }
 await closeLocal('Ты вышел из комнаты.');
}

ui.leave.onclick=()=>{if(room?.host_id===user?.id&&!confirm('Закрыть комнату для всех участников?'))return;void leave().catch(e=>status('Не удалось выйти: '+e.message,true));};
addEventListener('pagehide',()=>{
 cleanupVoice();clearInterval(heartbeat);detachVideo();
 if(channel)void sb?.removeChannel(channel);
});
async function start(){
 const params=new URLSearchParams(location.search);
 const anime=params.get('anime');
 if(anime)ui.anime.value=anime.replace(/^anilist-/,'').replace(/[^0-9]/g,'').slice(0,10);
 try{
  sb=client();
  if(!sb)throw Error('Модуль авторизации не загрузился.');
  const {data,error}=await sb.auth.getUser();
  if(error||!data.user)throw Error('Войди в аккаунт, чтобы создавать комнаты и присоединяться.');
  user=data.user;
  const invite=params.get('room');
  if(invite)await join(invite);
  else status('Войди в одну комнату с другом или создай свою.');
 }catch(e){
  status(e.message+' Перейти в аккаунт: animevoid.ru/account.html',true);
  const a=document.createElement('a');a.href='account.html';a.textContent='Войти или зарегистрироваться';a.style.display='inline-block';a.style.marginTop='10px';ui.status.append(document.createElement('br'),a);
  ui.create.disabled=true;
 }
}
void start();
})();