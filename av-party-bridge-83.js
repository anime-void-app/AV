/* ANIME VOID V83 — verified Kodik bridge events in party mode only.
   Never reads video segments, bypasses access, or asserts postMessage success. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('party')!=='1')return;
 const anime=String(params.get('id')||'').replace(/^anilist-/,'');
 if(!/^[1-9]\d{0,9}$/.test(anime)||anime==='4224')return; // Toradora uses its own full AVPlayer.
 const requested=Number(params.get('episode')||1);
 if(!Number.isSafeInteger(requested)||requested<1||requested>10000)return;
 const ORIGIN='https://kodikplayer.com';
 let frame=null,confirmedEpisode=null,started=false,playing=false,position=0,duration=0,lastSignalAt=0;
 function locate(){
  const found=document.querySelector('#avKodikInlineView iframe');
  if(!found||!found.src)return null;
  try{
   const url=new URL(found.src);
   if(url.origin!==ORIGIN||url.username||url.password||
      !/^\/(?:serial|video|season|seria)\/[1-9]\d*\/[a-f0-9]{32}\/720p$/.test(url.pathname))return null;
  }catch{return null;}
  if(frame!==found){
   frame=found;confirmedEpisode=null;started=false;playing=false;
   position=0;duration=0;lastSignalAt=0;
  }
  return frame;
 }
 function decode(raw){
  let d=raw;
  try{if(typeof d==='string'){if(d.length>16000)return null;d=JSON.parse(d);}}catch{return null;}
  if(!d||typeof d!=='object'||Array.isArray(d)||typeof d.key!=='string'
     ||!d.key.startsWith('kodik_player_'))return null;
  return d;
 }
 function message(event){
  const current=locate();
  if(!current||event.origin!==ORIGIN||event.source!==current.contentWindow)return;
  const data=decode(event.data);if(!data)return;
  const value=data.value;
  switch(data.key){
   case 'kodik_player_current_episode':{
    if(!value||typeof value!=='object')break;
    const number=Number(value.episode);
    const season=value.season==null?1:Number(value.season);
    if(Number.isSafeInteger(number)&&number===requested&&season===1)
      confirmedEpisode=number;
    else{
     confirmedEpisode=null;started=false;playing=false;
     position=0;duration=0;lastSignalAt=0;
    }
    break;
   }
   case 'kodik_player_duration_update':
    if(typeof value==='number'&&Number.isFinite(value)&&value>=60&&value<=43200){
     if(duration&&Math.abs(duration-value)>3){
      started=false;playing=false;position=0;lastSignalAt=0;
     }
     duration=value;
    }
    break;
   case 'kodik_player_video_started':
    // The provider may announce playback before its episode identity event.
    // Readiness remains gated on a later confirmed matching episode and live time.
    started=true;playing=true;break;
   case 'kodik_player_play':
    if(started)playing=true;
    break;
   case 'kodik_player_pause':
    if(started)playing=false;
    break;
   case 'kodik_player_video_ended':
    playing=false;break;
   case 'kodik_player_time':
   case 'kodik_player_time_update':
    if(!started||confirmedEpisode!==requested||!(duration>0)||
       typeof value!=='number'||!Number.isFinite(value)||value<0||value>duration+2)break;
    position=Math.min(duration,value);lastSignalAt=Date.now();
    break;
  }
 }
 addEventListener('message',message);
 function state(){
  const current=locate(),age=lastSignalAt?Math.max(0,Date.now()-lastSignalAt):Infinity;
  return {
   providerManaged:true,externalBridge:true,episode:confirmedEpisode,
   ready:!!current&&started&&confirmedEpisode===requested&&duration>0&&lastSignalAt>0,
   playing:started&&playing,position,duration,signalAgeMs:age
  };
 }
 function partyStart(){
  // User gesture is required inside Kodik. This only confirms the iframe exists.
  return !!locate();
 }
 function partyControl(action,seconds){
  const current=locate(),info=state();
  if(!current||!info.ready||!['play','pause','seek'].includes(action))return false;
  const payload={method:action};
  if(action==='seek'){
   if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<0||seconds>43200)return false;
   payload.seconds=Math.max(0,Math.min(duration-.1,seconds));
  }
  try{
   current.contentWindow.postMessage({key:'kodik_player_api',value:payload},ORIGIN);
   // Message dispatch does not confirm the player honored the command.
   return true;
  }catch{return false;}
 }
 window.AVPartyBridge83=Object.freeze({state,partyStart,partyControl});
 addEventListener('pagehide',()=>{removeEventListener('message',message);},{once:true});
})();
