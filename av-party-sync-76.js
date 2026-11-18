/* ANIME VOID V76: pure synchronization decisions, no player or network side effects. */
(function(root,make){
 'use strict';
 const api=make();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.AVPartySync=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const finite=value=>typeof value==='number'&&Number.isFinite(value);
 const validTime=(value,max=43200)=>finite(value)&&value>=0&&value<=max;
 function sampleProvider(state,episode){
  if(!state||state.providerManaged!==true||state.episode!==episode
      ||state.ready!==true||!validTime(state.position)
      ||!validTime(state.duration)||state.duration<=0)return null;
  // An actively playing iframe must provide a recent authenticated time signal.
  // A paused player may retain a known position for much longer.
  if(state.playing===true&&(!validTime(state.signalAgeMs,60000)||state.signalAgeMs>8000))return null;
  return {kind:'kodik',position:state.position,playing:state.playing===true,duration:state.duration};
 }
 function sampleNative(video){
  if(!video||video.tagName!=='VIDEO'||video.hidden||!video.currentSrc
      ||!validTime(video.currentTime)||!validTime(video.duration)||video.duration<=0)return null;
  return {kind:'html5',position:video.currentTime,playing:!video.paused&&!video.ended,duration:video.duration};
 }
 function target(room,receivedAt,now,duration){
  if(!room||!validTime(Number(room.playhead))||!validTime(duration)||duration<=0)return null;
  const delay=finite(receivedAt)&&receivedAt>0&&finite(now)?
   Math.max(0,Math.min(3,(now-receivedAt)/1000)):0;
  const expected=Number(room.playhead)+(room.is_playing===true?delay+0.15:0);
  return Math.min(Math.max(0,duration-0.25),Math.max(0,expected));
 }
 function planFollower(room,sample,receivedAt,now){
  if(!sample||!validTime(sample.position)||!validTime(sample.duration))return null;
  const expected=target(room,receivedAt,now,sample.duration);
  if(expected===null)return null;
  const drift=sample.position-expected;
  return {
   target:expected,drift,
   seek:Math.abs(drift)>=1.35?expected:null,
   action:room.is_playing===true&&!sample.playing?'play':
     room.is_playing!==true&&sample.playing?'pause':null,
   aligned:Math.abs(drift)<1.35&&sample.playing===(room.is_playing===true)
  };
 }
 return Object.freeze({sampleProvider,sampleNative,target,planFollower});
});
