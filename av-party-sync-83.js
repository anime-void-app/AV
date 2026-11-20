/* ANIME VOID V83 — deterministic two-device room clock.
   Pure functions, no storage/network. The server-authorized host row remains authoritative.
   Native HTML5 is controllable; third-party iframe control is only best-effort. */
(function(root,create){
 'use strict';
 const api=create();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.AVPartySync83=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const valid=n=>finite(n)&&n>=0&&n<=43200;
 const stamp=x=>Number.isFinite(Date.parse(x))?Date.parse(x):null;
 function sampleProvider(state,episode){
  if(!state||state.providerManaged!==true||state.episode!==episode||state.ready!==true
   ||!valid(state.position)||!valid(state.duration)||state.duration<1)return null;
  // No unverified position inference: the provider must report its live clock.
  if(state.playing===true&&(!valid(state.signalAgeMs)||state.signalAgeMs>8000))return null;
  return {kind:'kodik',position:state.position,duration:state.duration,playing:state.playing===true};
 }
 function sampleNative(video){
  if(!video||video.tagName!=='VIDEO'||video.hidden||!video.currentSrc
   ||!valid(video.currentTime)||!valid(video.duration)||video.duration<1)return null;
  return {kind:'html5',position:video.currentTime,duration:video.duration,playing:!video.paused&&!video.ended};
 }
 function acceptSnapshot(previous,incoming,lastReceivedAt,now){
  if(!incoming||typeof incoming!=='object'||!Number.isInteger(incoming.episode)||incoming.episode<1
   ||incoming.episode>10000||!valid(Number(incoming.playhead))||typeof incoming.is_playing!=='boolean')
    return {accept:false,receivedAt:lastReceivedAt,reason:'invalid'};
  if(!previous||previous.id!==incoming.id)return {accept:true,receivedAt:now,reason:'new'};
  const newer=stamp(incoming.updated_at),older=stamp(previous.updated_at);
  if(newer!==null&&older!==null&&newer<older)
    return {accept:false,receivedAt:lastReceivedAt,reason:'stale'};
  const unchanged=incoming.episode===previous.episode
   &&incoming.anime_id===previous.anime_id
   &&incoming.is_playing===previous.is_playing
   &&Number(incoming.playhead)===Number(previous.playhead);
  if(newer!==null&&older!==null&&newer===older&&unchanged)
    return {accept:false,receivedAt:lastReceivedAt,reason:'duplicate'};
  // Do not reset the clock after fetching the identical database row.
  if(unchanged)return {accept:true,receivedAt:lastReceivedAt||now,reason:'unchanged'};
  return {accept:true,receivedAt:now,reason:'changed'};
 }
 function age(receivedAt,now){
  return finite(receivedAt)&&receivedAt>0&&finite(now)?Math.max(0,now-receivedAt):0;
 }
 function target(room,receivedAt,now,duration){
  if(!room||!valid(Number(room.playhead))||!valid(duration)||duration<=0)return null;
  const delta=room.is_playing===true?Math.min(age(receivedAt,now)/1000,3)+0.12:0;
  return Math.max(0,Math.min(duration-0.1,Number(room.playhead)+delta));
 }
 function planFollower(room,sample,receivedAt,now){
  if(!room||!sample||!valid(sample.position)||!valid(sample.duration)||sample.duration<=0)return null;
  const old=age(receivedAt,now);
  if(room.is_playing===true&&old>8500)
   return {mode:'stale',target:null,drift:null,seek:null,action:null,rate:1,aligned:false};
  const expected=target(room,receivedAt,now,sample.duration);
  if(expected===null)return null;
  const drift=sample.position-expected;
  const playing=room.is_playing===true,kind=sample.kind==='html5'?'html5':'kodik';
  const seekThreshold=kind==='html5'?(playing?1.15:0.4):1.4;
  const seek=Math.abs(drift)>=seekThreshold?expected:null;
  const action=playing&&!sample.playing?'play':!playing&&sample.playing?'pause':null;
  let rate=1;
  if(kind==='html5'&&playing&&sample.playing&&seek===null&&Math.abs(drift)>=0.28)
   rate=drift>0?0.96:1.04;
  return {
   mode:kind,target:expected,drift,seek,action,rate,
   aligned:Math.abs(drift)<0.65&&sample.playing===playing
  };
 }
 function format(seconds){
  if(!valid(seconds))return '—:—';
  const total=Math.floor(seconds);
  return Math.floor(total/60).toString().padStart(2,'0')+':'+(total%60).toString().padStart(2,'0');
 }
 return Object.freeze({sampleProvider,sampleNative,acceptSnapshot,target,planFollower,format});
});
